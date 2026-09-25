package dev.nomad.auth;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONObject;
import okhttp3.*;
import java.io.File;
import java.io.FileOutputStream;
import java.security.MessageDigest;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

@CapacitorPlugin(name = "NomadNativeAuth")
public class NomadNativeAuthPlugin extends Plugin {
    private final ExecutorService serial = Executors.newSingleThreadExecutor();
    private final ExecutorService streams = Executors.newFixedThreadPool(2);
    private final AtomicLong activity = new AtomicLong();
    private static class RequestControl { volatile boolean cancelled; volatile Call call; }
    private final Map<String, RequestControl> requests = new ConcurrentHashMap<>();
    private final Map<String, Stream> subscriptions = new ConcurrentHashMap<>();
    private volatile boolean active = true;
    private volatile long confirmedActivity = -1;
    private AuthVault vault;
    private AuthNetwork network;
    private LinearLayout shield;
    private interface Work { JSONObject run() throws Exception; }
    private static class Stream {
        final Request request; final JSONObject state; final long activity; volatile Call call;
        Stream(Request request, JSONObject state, long activity) { this.request = request; this.state = state; this.activity = activity; }
    }
    @Override public void load() {
        try {
            network = new AuthNetwork(getConfig().getString("apiOrigin", ""), getConfig().getString("apiBasePath", "/api"));
            vault = new AuthVault(getContext(), network.origin + "|" + network.basePath); purgeCache(); mask();
        } catch (Exception ignored) { network = null; vault = null; }
    }
    private void execute(PluginCall call, Work work) {
        serial.execute(() -> {
            try {
                if (network == null || vault == null) throw new Exception("AUTH_NATIVE_UNAVAILABLE");
                call.resolve(JSObject.fromJSONObject(work.run()));
            } catch (Exception error) {
                String code = error.getMessage();
                if (code == null || !code.matches("AUTH_[A-Z_]{1,80}")) code = "AUTH_NATIVE_UNAVAILABLE";
                call.reject("Native authentication request did not complete", code); // Never attach URL/body/key/exception.
            }
        });
    }
    private JSONObject expected(JSONObject state) throws Exception {
        return new JSONObject().put("ownerId", state.optString("ownerId", "anonymous")).put("sessionId", state.optString("sessionId", "anonymous"))
            .put("generation", state.optLong("generation", 0));
    }
    private JSONObject qualify(PluginCall call) throws Exception {
        JSONObject state = vault.snapshot(), supplied = call.getObject("expected");
        if (!active || confirmedActivity != activity.get()) throw new Exception("AUTH_CONTEXT_UNCONFIRMED");
        if (state.optJSONObject("logout") != null) throw new Exception("AUTH_LOGOUT_UNCONFIRMED");
        if (supplied == null || !supplied.optString("ownerId").equals(state.optString("ownerId", "anonymous"))
            || !supplied.optString("sessionId").equals(state.optString("sessionId", "anonymous"))
            || (!state.optString("credential").isEmpty() && supplied.optLong("generation", -1) != state.optLong("generation"))) throw new Exception("AUTH_CONTEXT_CHANGED");
        return state;
    }
    private void stillCurrent(JSONObject state, long stamp) throws Exception {
        if (!active || stamp != activity.get() || state.optLong("generation") != vault.snapshot().optLong("generation")) throw new Exception("AUTH_CONTEXT_CHANGED");
    }
    private JSONObject body(JSONObject response) throws Exception {
        int status = response.getInt("status");
        JSONObject result = response.optString("body").isEmpty() ? new JSONObject() : new JSONObject(response.getString("body"));
        if (status < 200 || status > 299) {
            String code = result.optString("error_code");
            throw new Exception(code.matches("AUTH_[A-Z_]{1,80}") ? code : "AUTH_NATIVE_UNAVAILABLE");
        }
        return result;
    }
    private JSONObject publicUser(JSONObject raw, long generation) throws Exception {
        String owner = raw.getString("user_id"); JSONObject session = raw.getJSONObject("session");
        UUID.fromString(owner); UUID.fromString(session.getString("id"));
        return new JSONObject().put("user_id", owner).put("user", new JSONObject().put("id", owner).put("phone", JSONObject.NULL))
            .put("session", new JSONObject().put("id", session.getString("id")).put("device_id", session.getString("device_id"))
                .put("created_at", session.optString("created_at")).put("expires_at", session.getString("expires_at")))
            .put("native_generation", generation);
    }
    private void clearCredential(JSONObject state) throws Exception {
        JSONObject next = new JSONObject().put("binding", state.getString("binding")).put("generation", state.optLong("generation") + 1);
        if (state.optJSONObject("logout") != null) next.put("completedLogout", state.getJSONObject("logout"));
        purgeCache(); vault.replace(next); closeAll(); mask(); changed("invalidated", next.optLong("generation"));
    }
    private void changed(String reason, long generation) {
        JSObject event = new JSObject(); event.put("reason", reason); event.put("generation", generation); notifyListeners("nativeAuthChanged", event);
    }
    @PluginMethod public void status(PluginCall call) {
        JSObject result = new JSObject(); result.put("available", network != null && vault != null); result.put("platform", "android");
        result.put("apiOrigin", network == null ? "" : network.origin);
        try { result.put("generation", vault == null ? 0 : vault.snapshot().optLong("generation")); } catch (Exception ignored) { result.put("available", false); }
        call.resolve(result);
    }
    @PluginMethod public void getConfig(PluginCall call) { execute(call, () -> network.json(network.request("/auth/config", "GET", null, new JSONObject(), false, null, null))); }
    @PluginMethod public void getCurrentUser(PluginCall call) { execute(call, () -> {
        JSONObject state = vault.snapshot(); long stamp = activity.get();
        if (state.optJSONObject("logout") != null) { finishLogout(state, state.getJSONObject("logout")); throw new Exception("AUTH_SESSION_EXPIRED"); }
        if (!active) throw new Exception("AUTH_CONTEXT_UNCONFIRMED");
        if (state.optString("credential").isEmpty()) { confirmedActivity = stamp; throw new Exception("AUTH_SESSION_EXPIRED"); }
        JSONObject response = network.json(network.request("/me", "GET", null, state, false, null, null));
        stillCurrent(state, stamp);
        if (response.getInt("status") == 401) { clearCredential(state); throw new Exception("AUTH_SESSION_EXPIRED"); }
        JSONObject user = publicUser(body(response), state.optLong("generation"));
        if (!user.getString("user_id").equals(state.optString("ownerId")) || !user.getJSONObject("session").getString("id").equals(state.optString("sessionId"))) throw new Exception("AUTH_CONTEXT_CHANGED");
        confirmedActivity = stamp; return user;
    }); }
    @PluginMethod public void startOtp(PluginCall call) { execute(call, () -> {
        JSONObject state = qualify(call); long stamp = activity.get(); JSONObject input = call.getObject("request");
        if (input == null) throw new Exception("AUTH_PARAMS_INVALID");
        JSONObject response = network.json(network.request("/auth/native/otp/start", "POST", input.toString(), state, true, expected(state), null));
        stillCurrent(state, stamp); return response;
    }); }
    @PluginMethod public void verifyOtp(PluginCall call) { execute(call, () -> {
        JSONObject state = qualify(call); long stamp = activity.get(); JSONObject input = call.getObject("request");
        if (input == null) throw new Exception("AUTH_PARAMS_INVALID");
        JSONObject raw = body(network.json(network.request("/auth/native/otp/verify", "POST", input.toString(), state, true, expected(state), null)));
        // A late result may represent a server session, but cannot overwrite a changed native context.
        stillCurrent(state, stamp); String credential = raw.getString("native_session_credential");
        if (!credential.matches("[A-Za-z0-9_-]{43}")) throw new Exception("AUTH_NATIVE_UNAVAILABLE");
        long generation = state.optLong("generation") + 1; JSONObject user = publicUser(raw, generation);
        JSONObject next = new JSONObject(state.toString()).put("credential", credential).put("ownerId", user.getString("user_id"))
            .put("sessionId", user.getJSONObject("session").getString("id")).put("generation", generation);
        next.remove("logout"); purgeCache(); vault.replace(next); confirmedActivity = -1; closeAll(); mask(); return user;
    }); }
    @PluginMethod public void logout(PluginCall call) { execute(call, () -> {
        JSONObject state = vault.snapshot(); JSONObject supplied = call.getObject("expected"); String operation = call.getString("operationId");
        if (supplied == null || operation == null) throw new Exception("AUTH_PARAMS_INVALID"); UUID.fromString(operation);
        JSONObject completed = state.optJSONObject("completedLogout");
        if (completed != null && completed.optString("operationId").equals(operation)
            && completed.getJSONObject("expected").toString().equals(supplied.toString())) return new JSONObject().put("ok", true);
        JSONObject pending = state.optJSONObject("logout");
        if (pending == null) { qualify(call); pending = new JSONObject().put("operationId", operation).put("expected", supplied); state.put("logout", pending); vault.replace(state); }
        if (!pending.getString("operationId").equals(operation) || !pending.getJSONObject("expected").toString().equals(supplied.toString())) throw new Exception("AUTH_CONTEXT_CHANGED");
        finishLogout(state, pending); return new JSONObject().put("ok", true);
    }); }
    private void finishLogout(JSONObject state, JSONObject pending) throws Exception {
        if (!active) throw new Exception("AUTH_CONTEXT_UNCONFIRMED");
        long stamp = activity.get(); JSONObject receipt = body(network.json(network.request("/logout", "POST",
            new JSONObject().put("operation_id", pending.getString("operationId")).toString(), state, false, pending.getJSONObject("expected"), null)));
        stillCurrent(state, stamp); if (!receipt.optBoolean("ok")) throw new Exception("AUTH_NATIVE_UNAVAILABLE");
        clearCredential(state);
    }
    @PluginMethod public void request(PluginCall call) {
        String id = call.getString("requestId");
        try { UUID.fromString(id); } catch (Exception ignored) { call.reject("Invalid request", "AUTH_PARAMS_INVALID"); return; }
        if (requests.size() >= 64 || network == null || vault == null) { call.reject("Native request unavailable", "AUTH_NATIVE_UNAVAILABLE"); return; }
        RequestControl control = new RequestControl();
        if (requests.putIfAbsent(id, control) != null) { call.reject("Duplicate request", "AUTH_PARAMS_INVALID"); return; }
        execute(call, () -> {
            try {
                if (control.cancelled) throw new Exception("AUTH_REQUEST_CANCELLED");
                JSONObject state = qualify(call); long stamp = activity.get(); String path = call.getString("path"); network.businessPath(path);
                JSONObject headers = call.getObject("headers");
                control.call = network.client.newCall(network.request(path, call.getString("method", "GET"), call.getString("body"), state, false, expected(state), headers == null ? null : headers.optString("Idempotency-Key", null)));
                if (control.cancelled) { control.call.cancel(); throw new Exception("AUTH_REQUEST_CANCELLED"); }
                JSONObject response = network.json(control.call);
                if (control.cancelled) throw new Exception("AUTH_REQUEST_CANCELLED");
                stillCurrent(state, stamp); return response;
            } finally { requests.remove(id); }
        });
    }
    @PluginMethod public void cancelRequest(PluginCall call) {
        String id = call.getString("requestId"); RequestControl control = id == null ? null : requests.get(id);
        if (control != null) { control.cancelled = true; if (control.call != null) control.call.cancel(); }
        call.resolve();
    }
    @PluginMethod public void openStream(PluginCall call) { execute(call, () -> {
        JSONObject state = qualify(call); String path = call.getString("path"); network.businessPath(path);
        if (!(path.startsWith("/sse/") || path.split("\\?", 2)[0].endsWith("/events")) || subscriptions.size() >= 2) throw new Exception("AUTH_NATIVE_PATH_REJECTED");
        Request.Builder builder = network.request(path, "GET", null, state, false, expected(state), null).newBuilder().header("Accept", "text/event-stream");
        String last = call.getString("lastEventId"); if (last != null) { if (!last.matches("[A-Za-z0-9:_-]{1,128}")) throw new Exception("AUTH_PARAMS_INVALID"); builder.header("Last-Event-ID", last); }
        String id = UUID.randomUUID().toString(); subscriptions.put(id, new Stream(builder.build(), state, activity.get()));
        return new JSONObject().put("subscriptionId", id);
    }); }
    @PluginMethod public void startStream(PluginCall call) { execute(call, () -> {
        String id = call.getString("subscriptionId"); Stream stream = subscriptions.get(id);
        if (stream == null || stream.call != null) throw new Exception("AUTH_CONTEXT_CHANGED");
        stillCurrent(stream.state, stream.activity);
        stream.call = network.client.newBuilder().callTimeout(0, TimeUnit.SECONDS).readTimeout(45, TimeUnit.SECONDS).build().newCall(stream.request);
        streams.execute(() -> consume(id, stream)); return new JSONObject();
    }); }
    private void consume(String id, Stream stream) {
        try (Response response = stream.call.execute()) {
            if (response.code() != 200 || response.body() == null || !response.header("Content-Type", "").startsWith("text/event-stream")) throw new Exception("AUTH_STREAM_UNAVAILABLE");
            String event = "message", eventId = ""; StringBuilder data = new StringBuilder(); long window = System.nanoTime(); int count = 0;
            while (subscriptions.get(id) == stream && !response.body().source().exhausted()) {
                stillCurrent(stream.state, stream.activity);
                String line = response.body().source().readUtf8LineStrict(65536);
                if (line.isEmpty()) {
                    if (data.length() > 0) {
                        if (System.nanoTime() - window > TimeUnit.SECONDS.toNanos(1)) { count = 0; window = System.nanoTime(); }
                        if (++count > 100) throw new Exception("AUTH_STREAM_LIMIT");
                        JSObject message = streamEvent(id, stream); message.put("event", event); message.put("id", eventId); message.put("data", data.substring(0, data.length()-1));
                        notifyListeners("nativeAuthStream", message);
                    }
                    data.setLength(0); event = "message";
                } else if (line.startsWith("data:")) { data.append(line.substring(5).replaceFirst("^ ", "")).append('\n'); if (data.length() > 262144) throw new Exception("AUTH_STREAM_LIMIT"); }
                else if (line.startsWith("event:")) event = line.substring(6).trim();
                else if (line.startsWith("id:")) eventId = line.substring(3).trim();
            }
        } catch (Exception ignored) { /* Only the fixed public closure below crosses the bridge. */ }
        finally {
            if (subscriptions.remove(id, stream)) {
                JSObject message = streamEvent(id, stream); message.put("closed", true); message.put("error_code", "AUTH_STREAM_UNAVAILABLE"); notifyListeners("nativeAuthStream", message);
            }
        }
    }
    private JSObject streamEvent(String id, Stream stream) {
        JSObject event = new JSObject(); event.put("subscriptionId", id); event.put("ownerId", stream.state.optString("ownerId"));
        event.put("sessionId", stream.state.optString("sessionId")); event.put("generation", stream.state.optLong("generation")); return event;
    }
    @PluginMethod public void closeStream(PluginCall call) { String id = call.getString("subscriptionId"); if (id != null) { Stream stream = subscriptions.remove(id); if (stream != null && stream.call != null) stream.call.cancel(); } call.resolve(); }
    private void closeAll() { for (String id : subscriptions.keySet()) { Stream stream = subscriptions.remove(id); if (stream != null && stream.call != null) stream.call.cancel(); } }
    @PluginMethod public void download(PluginCall call) { execute(call, () -> {
        JSONObject state = qualify(call); long stamp = activity.get(); String path = call.getString("path"); network.businessPath(path);
        int max = call.getInt("maxBytes", 0); if (max <= 0 || max > 50*1024*1024) throw new Exception("AUTH_PARAMS_INVALID");
        String digest = call.getString("expectedSha256"); if (digest != null && !digest.matches("[a-f0-9]{64}")) throw new Exception("AUTH_PARAMS_INVALID");
        File folder = new File(getContext().getCacheDir(), "nomad-auth/" + state.getString("ownerId") + "/" + state.optLong("generation"));
        if (!folder.isDirectory() && !folder.mkdirs()) throw new Exception("AUTH_DOWNLOAD_UNAVAILABLE");
        String handle = UUID.randomUUID().toString(); File file = new File(folder, handle); boolean keep = false;
        try (Response response = network.client.newCall(network.request(path, "GET", null, state, false, expected(state), null)).execute()) {
            String mime = response.header("Content-Type", "").split(";",2)[0];
            if (response.code() != 200 || response.body() == null || !mime.matches("image/(png|jpeg|webp)|application/(pdf|zip|json)")) throw new Exception("AUTH_DOWNLOAD_UNAVAILABLE");
            MessageDigest sha = MessageDigest.getInstance("SHA-256"); long bytes = 0;
            try (FileOutputStream output = new FileOutputStream(file)) {
                byte[] buffer = new byte[8192]; int count; java.io.InputStream input = response.body().byteStream();
                while ((count = input.read(buffer)) != -1) { stillCurrent(state, stamp); bytes += count; if (bytes > max) throw new Exception("AUTH_RESPONSE_TOO_LARGE"); sha.update(buffer,0,count); output.write(buffer,0,count); }
                output.getFD().sync();
            }
            StringBuilder hex = new StringBuilder(); for (byte value : sha.digest()) hex.append(String.format("%02x", value));
            stillCurrent(state, stamp); if (digest != null && !digest.equals(hex.toString())) throw new Exception("AUTH_DOWNLOAD_INTEGRITY");
            keep = true; return new JSONObject().put("handle", handle).put("bytes", bytes).put("sha256", hex.toString()).put("mimeType", mime);
        } finally { if (!keep) file.delete(); }
    }); }
    @PluginMethod public void acknowledgeView(PluginCall call) { final long requestedActivity = activity.get(); execute(call, () -> {
        JSONObject state = qualify(call); long stamp = requestedActivity;
        stillCurrent(state, stamp); if (confirmedActivity != stamp) throw new Exception("AUTH_CONTEXT_UNCONFIRMED");
        getActivity().runOnUiThread(() -> { try { stillCurrent(state, stamp); if (shield != null) shield.setVisibility(View.GONE); } catch (Exception ignored) {} });
        return new JSONObject();
    }); }
    private void purgeCache() throws Exception { removePrivateCache(new File(getContext().getCacheDir(), "nomad-auth")); }
    private void removePrivateCache(File file) throws Exception {
        if (!file.exists()) return;
        File[] children = file.listFiles(); if (children != null) for (File child : children) removePrivateCache(child);
        if (!file.delete() && file.exists()) throw new Exception("AUTH_PRIVATE_CACHE_UNAVAILABLE");
    }
    private void mask() {
        getActivity().runOnUiThread(() -> {
            if (shield == null) {
                shield = new LinearLayout(getContext()); shield.setOrientation(LinearLayout.VERTICAL); shield.setGravity(android.view.Gravity.CENTER); shield.setBackgroundColor(Color.WHITE);
                TextView text = new TextView(getContext()); text.setText("正在确认登录状态"); text.setTextColor(Color.BLACK); shield.addView(text);
                Button retry = new Button(getContext()); retry.setText("重试确认"); retry.setOnClickListener(v -> changed("resume", 0)); shield.addView(retry);
                ((ViewGroup) getBridge().getWebView().getParent()).addView(shield, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            }
            shield.setVisibility(View.VISIBLE); shield.bringToFront();
        });
    }
    @Override protected void handleOnPause() { active = false; confirmedActivity = -1; activity.incrementAndGet();
        for (RequestControl control : requests.values()) { control.cancelled = true; if (control.call != null) control.call.cancel(); }
        closeAll(); if (network != null) mask(); }
    @Override protected void handleOnResume() { active = true; if (network != null) { mask(); changed("resume", 0); } }
    @Override protected void handleOnDestroy() { activity.incrementAndGet(); active = false; closeAll(); serial.shutdownNow(); streams.shutdownNow(); }
}
