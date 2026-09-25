package dev.nomad.auth;

import okhttp3.*;
import java.net.URI;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

final class AuthNetwork {
    final String origin;
    final String basePath;
    final OkHttpClient client = new OkHttpClient.Builder().cookieJar(CookieJar.NO_COOKIES).cache(null)
        .followRedirects(false).followSslRedirects(false).retryOnConnectionFailure(false)
        .connectTimeout(5, TimeUnit.SECONDS).writeTimeout(5, TimeUnit.SECONDS).readTimeout(15, TimeUnit.SECONDS).callTimeout(20, TimeUnit.SECONDS).build();
    AuthNetwork(String origin, String basePath) throws Exception {
        URI uri = new URI(origin);
        if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getRawUserInfo() != null || uri.getRawQuery() != null
            || uri.getRawFragment() != null || !(uri.getRawPath().isEmpty() || "/".equals(uri.getRawPath()))) throw new Exception("AUTH_NATIVE_UNAVAILABLE");
        // Native deployments use a DNS name. This also excludes ambiguous IP host canonicalization.
        if (!uri.getHost().matches("(?i)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z][a-z0-9-]{0,62}")) throw new Exception("AUTH_NATIVE_UNAVAILABLE");
        this.origin = new URI("https", null, uri.getHost().toLowerCase(java.util.Locale.ROOT), uri.getPort() == 443 ? -1 : uri.getPort(), null, null, null).toASCIIString();
        if (basePath == null) basePath = "/api";
        if (!(basePath.isEmpty() || basePath.matches("(/[A-Za-z0-9_-]+)*"))) throw new Exception("AUTH_NATIVE_UNAVAILABLE");
        this.basePath = basePath;
    }
    String url(String path) throws Exception {
        if (path == null || !path.startsWith("/") || path.startsWith("//") || path.contains("\\") || path.contains("#")
            || path.length() > 4096 || path.matches(".*[\\p{Cntrl}\\s].*")) throw new Exception("AUTH_NATIVE_PATH_REJECTED");
        URI uri = new URI(path);
        if (uri.isAbsolute() || uri.getRawAuthority() != null || !uri.normalize().getRawPath().equals(uri.getRawPath())
            || uri.getRawPath().toLowerCase().matches(".*%(2e|2f|5c).*")) throw new Exception("AUTH_NATIVE_PATH_REJECTED");
        return origin + basePath + path;
    }
    void businessPath(String path) throws Exception {
        url(path);
        String clean = path.split("\\?", 2)[0];
        if (!((clean.equals("/sessions") || clean.equals("/account") || clean.equals("/user-key")) || clean.matches("/(home|library|plan|ingest|jobs|search|account|feedback|byok|sse|exports|sessions)/.*"))) {
            throw new Exception("AUTH_NATIVE_PATH_REJECTED");
        }
    }
    Request request(String path, String method, String body, JSONObject state, boolean binding, JSONObject expected, String idempotency) throws Exception {
        if (!method.matches("GET|POST|PUT|PATCH|DELETE")) throw new Exception("AUTH_PARAMS_INVALID");
        Request.Builder builder = new Request.Builder().url(url(path)).header("Accept", "application/json")
            .header("X-Nomad-Auth-Audience", origin).header("Cache-Control", "no-store");
        String secret = state.optString("credential", "");
        if (!secret.isEmpty()) builder.header("Authorization", "Bearer " + secret);
        if (binding) builder.header("X-Nomad-Login-Binding", state.getString("binding"));
        if (expected != null) builder.header("X-Auth-User-Id", expected.getString("ownerId")).header("X-Auth-Session-Id", expected.getString("sessionId"));
        if (idempotency != null) {
            if (!idempotency.matches("[A-Za-z0-9_-]{1,128}")) throw new Exception("AUTH_PARAMS_INVALID");
            builder.header("Idempotency-Key", idempotency);
        }
        if (body != null && body.length() > 1048576) throw new Exception("AUTH_PARAMS_INVALID");
        RequestBody payload = body == null ? null : RequestBody.create(body, MediaType.get("application/json; charset=utf-8"));
        if ((method.equals("POST") || method.equals("PUT") || method.equals("PATCH")) && payload == null) payload = RequestBody.create("{}", MediaType.get("application/json"));
        return builder.method(method, payload).build();
    }
    static byte[] bounded(InputStream stream, long max) throws Exception {
        ByteArrayOutputStream result = new ByteArrayOutputStream(); byte[] buffer = new byte[8192]; int count;
        while ((count = stream.read(buffer)) != -1) {
            if ((long) result.size() + count > max) throw new Exception("AUTH_RESPONSE_TOO_LARGE");
            result.write(buffer, 0, count);
        }
        return result.toByteArray();
    }
    JSONObject json(Request request) throws Exception { return json(client.newCall(request)); }
    JSONObject json(Call call) throws Exception {
        try (Response response = call.execute()) {
            if (response.code() >= 300 && response.code() < 400) throw new Exception("AUTH_REDIRECT_REJECTED");
            if (response.body() == null) throw new Exception("AUTH_NATIVE_UNAVAILABLE");
            String text = new String(bounded(response.body().byteStream(), 2 * 1024 * 1024), StandardCharsets.UTF_8);
            JSONObject headers = new JSONObject();
            if (response.header("Retry-After") != null) headers.put("Retry-After", response.header("Retry-After"));
            if (response.header("Content-Type") != null) headers.put("Content-Type", response.header("Content-Type"));
            return new JSONObject().put("status", response.code()).put("headers", headers).put("body", text);
        }
    }
}
