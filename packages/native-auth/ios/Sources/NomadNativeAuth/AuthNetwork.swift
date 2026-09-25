import Foundation

struct NativeReply {
    let status: Int
    let headers: [String: String]
    let bytes: Data
    var object: [String: Any] { ["status": status, "headers": headers, "body": String(data: bytes, encoding: .utf8) ?? ""] }
}
final class HttpExchange: NSObject, URLSessionDataDelegate {
    private let completed = DispatchSemaphore(value: 0)
    private let maxBytes: Int
    private var data = Data()
    private var response: HTTPURLResponse?
    private var failure: Error?
    private var session: URLSession?
    private var task: URLSessionDataTask?
    private let stream: ((String) -> Void)?
    private let closed: (() -> Void)?
    init(maxBytes: Int, stream: ((String) -> Void)? = nil, closed: (() -> Void)? = nil) { self.maxBytes = maxBytes; self.stream = stream; self.closed = closed }
    func start(_ request: URLRequest) {
        let config = URLSessionConfiguration.ephemeral
        config.httpCookieStorage = nil; config.httpShouldSetCookies = false; config.urlCredentialStorage = nil
        config.urlCache = nil; config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.timeoutIntervalForRequest = stream == nil ? 15 : 45; config.timeoutIntervalForResource = stream == nil ? 25 : 86400
        let queue = OperationQueue(); queue.maxConcurrentOperationCount = 1
        session = URLSession(configuration: config, delegate: self, delegateQueue: queue)
        task = session?.dataTask(with: request); task?.resume()
    }
    func cancel() { task?.cancel(); session?.invalidateAndCancel() }
    func wait() throws -> NativeReply {
        guard completed.wait(timeout: .now() + 30) == .success else { cancel(); throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        if let failure { throw failure }
        guard let response else { throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        var headers: [String: String] = [:]
        for name in ["Content-Type", "Retry-After"] { if let value = response.value(forHTTPHeaderField: name) { headers[name] = value } }
        return NativeReply(status: response.statusCode, headers: headers, bytes: data)
    }
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        failure = AuthFailure.code("AUTH_REDIRECT_REJECTED"); completionHandler(nil)
    }
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        guard let http = response as? HTTPURLResponse, !(300..<400).contains(http.statusCode),
              response.expectedContentLength <= Int64(maxBytes) || stream != nil else {
            failure = AuthFailure.code("AUTH_RESPONSE_TOO_LARGE"); completionHandler(.cancel); return
        }
        self.response = http
        if stream != nil && (http.statusCode != 200 || !(http.value(forHTTPHeaderField: "Content-Type") ?? "").hasPrefix("text/event-stream")) {
            failure = AuthFailure.code("AUTH_STREAM_UNAVAILABLE"); completionHandler(.cancel); return
        }
        completionHandler(.allow)
    }
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive received: Data) {
        guard data.count + received.count <= maxBytes else { failure = AuthFailure.code("AUTH_RESPONSE_TOO_LARGE"); cancel(); return }
        data.append(received)
        if let stream {
            while let newline = data.firstIndex(of: 10) {
                let line = data.prefix(upTo: newline); data.removeSubrange(...newline)
                guard line.count <= 65536, let text = String(data: line, encoding: .utf8) else { failure = AuthFailure.code("AUTH_STREAM_UNAVAILABLE"); cancel(); return }
                stream(text.hasSuffix("\r") ? String(text.dropLast()) : text)
            }
        }
    }
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if failure == nil { failure = error }
        completed.signal(); closed?(); session.finishTasksAndInvalidate(); self.session = nil
    }
}
final class AuthNetwork {
    let origin: String
    let basePath: String
    init(origin: String, basePath: String) throws {
        guard let parts = URLComponents(string: origin), parts.scheme == "https", parts.host != nil, parts.user == nil, parts.password == nil,
              parts.query == nil, parts.fragment == nil, ["", "/"].contains(parts.path),
              basePath.range(of: "^(/[A-Za-z0-9_-]+)*$", options: .regularExpression) != nil else { throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        guard parts.host?.range(of: "^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z][a-z0-9-]{0,62}$", options: [.regularExpression, .caseInsensitive]) != nil else { throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        var normalized = parts; normalized.host = parts.host?.lowercased(); normalized.path = ""
        if normalized.port == 443 { normalized.port = nil }
        guard let canonical = normalized.string else { throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        self.origin = canonical; self.basePath = basePath
    }
    func url(_ path: String) throws -> URL {
        guard path.hasPrefix("/"), !path.hasPrefix("//"), !path.contains("\\"), !path.contains("#"), path.count <= 4096,
              path.rangeOfCharacter(from: .whitespacesAndNewlines.union(.controlCharacters)) == nil,
              let parts = URLComponents(string: path), parts.scheme == nil, parts.host == nil,
              !parts.path.split(separator: "/").contains(where: { $0 == ".." || $0 == "." }),
              parts.percentEncodedPath.range(of: "%2e|%2f|%5c", options: [.regularExpression, .caseInsensitive]) == nil,
              let result = URL(string: origin + basePath + path) else { throw AuthFailure.code("AUTH_NATIVE_PATH_REJECTED") }
        return result
    }
    func businessPath(_ path: String) throws {
        _ = try url(path)
        let clean = String(path.split(separator: "?", maxSplits: 1)[0])
        guard ["/sessions", "/account", "/user-key"].contains(clean) || clean.range(of: "^/(home|library|plan|ingest|jobs|search|account|feedback|byok|sse|exports|sessions)/", options: .regularExpression) != nil else { throw AuthFailure.code("AUTH_NATIVE_PATH_REJECTED") }
    }
    func request(path: String, method: String = "GET", body: String? = nil, state: [String: Any] = [:], binding: Bool = false, expected: [String: Any]? = nil, idempotency: String? = nil) throws -> URLRequest {
        guard ["GET", "POST", "PUT", "PATCH", "DELETE"].contains(method), (body?.utf8.count ?? 0) <= 1048576 else { throw AuthFailure.code("AUTH_PARAMS_INVALID") }
        var request = URLRequest(url: try url(path)); request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept"); request.setValue(origin, forHTTPHeaderField: "X-Nomad-Auth-Audience")
        request.setValue("no-store", forHTTPHeaderField: "Cache-Control"); request.httpShouldHandleCookies = false
        if let secret = state["credential"] as? String { request.setValue("Bearer \(secret)", forHTTPHeaderField: "Authorization") }
        if binding { request.setValue(state["binding"] as? String, forHTTPHeaderField: "X-Nomad-Login-Binding") }
        if let expected { request.setValue(expected["ownerId"] as? String, forHTTPHeaderField: "X-Auth-User-Id"); request.setValue(expected["sessionId"] as? String, forHTTPHeaderField: "X-Auth-Session-Id") }
        if let idempotency {
            guard idempotency.range(of: "^[A-Za-z0-9_-]{1,128}$", options: .regularExpression) != nil else { throw AuthFailure.code("AUTH_PARAMS_INVALID") }
            request.setValue(idempotency, forHTTPHeaderField: "Idempotency-Key")
        }
        if let body { request.httpBody = Data(body.utf8); request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        return request
    }
    func perform(_ request: URLRequest, maxBytes: Int = 2 * 1024 * 1024) throws -> NativeReply {
        let exchange = HttpExchange(maxBytes: maxBytes); exchange.start(request); return try exchange.wait()
    }
}
