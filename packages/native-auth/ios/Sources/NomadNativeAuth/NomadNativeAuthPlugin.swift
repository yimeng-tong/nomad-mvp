import Foundation
import Capacitor
import UIKit
import CryptoKit

private final class NativeRequestControl { var cancelled = false; var exchange: HttpExchange? }
private final class NativeStream {
    let request: URLRequest
    let state: [String: Any]
    let activity: Int
    var exchange: HttpExchange?
    var event = "message", eventId = "", data = ""
    var window = Date(), count = 0
    init(request: URLRequest, state: [String: Any], activity: Int) { self.request = request; self.state = state; self.activity = activity }
}
@objc(NomadNativeAuthPlugin)
public class NomadNativeAuthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NomadNativeAuthPlugin"
    public let jsName = "NomadNativeAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        "status", "getConfig", "getCurrentUser", "startOtp", "verifyOtp", "logout", "request", "cancelRequest", "openStream", "startStream", "closeStream", "download", "acknowledgeView"
    ].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }
    private let serial = DispatchQueue(label: "nomad.native.auth")
    private let contextLock = NSLock(), streamLock = NSLock(), requestLock = NSLock()
    private var requests: [String: NativeRequestControl] = [:]
    private var activity = 0, active = true
    private var confirmedActivity = -1
    private var subscriptions: [String: NativeStream] = [:]
    private var observers: [NSObjectProtocol] = []
    private var network: AuthNetwork?, vault: AuthVault?
    private var shield: UIView?
    public override func load() {
        do {
            network = try AuthNetwork(origin: getConfig().getString("apiOrigin") ?? "", basePath: getConfig().getString("apiBasePath") ?? "/api")
            vault = try AuthVault(audience: network!.origin + "|" + network!.basePath); try purgeCache(); mask()
            observers.append(NotificationCenter.default.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in self?.background() })
            observers.append(NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in self?.foreground() })
        } catch { network = nil; vault = nil }
    }
    deinit { observers.forEach(NotificationCenter.default.removeObserver); closeAll() }
    private func execute(_ call: CAPPluginCall, _ work: @escaping (AuthNetwork, AuthVault) throws -> [String: Any]) {
        serial.async { [weak self] in
            guard let self, let network = self.network, let vault = self.vault else { call.reject("Native authentication unavailable", "AUTH_NATIVE_UNAVAILABLE"); return }
            do { call.resolve(try work(network, vault)) }
            catch AuthFailure.code(let code) { call.reject("Native authentication request did not complete", code) }
            catch { call.reject("Native authentication request did not complete", "AUTH_NATIVE_UNAVAILABLE") }
        }
    }
    private func context() -> (Bool, Int) { contextLock.lock(); defer { contextLock.unlock() }; return (active, activity) }
    private func expected(_ state: [String: Any]) -> [String: Any] {
        ["ownerId": state["ownerId"] ?? "anonymous", "sessionId": state["sessionId"] ?? "anonymous", "generation": state["generation"] ?? 0]
    }
    private func qualify(_ call: CAPPluginCall, _ vault: AuthVault) throws -> [String: Any] {
        let state = vault.snapshot()
        guard context().0, confirmation() == context().1 else { throw AuthFailure.code("AUTH_CONTEXT_UNCONFIRMED") }
        guard state["logout"] == nil else { throw AuthFailure.code("AUTH_LOGOUT_UNCONFIRMED") }
        guard let supplied = call.getObject("expected"), supplied["ownerId"] as? String == (state["ownerId"] as? String ?? "anonymous"),
              supplied["sessionId"] as? String == (state["sessionId"] as? String ?? "anonymous"),
              state["credential"] == nil || supplied["generation"] as? Int == state["generation"] as? Int else { throw AuthFailure.code("AUTH_CONTEXT_CHANGED") }
        return state
    }
    private func stillCurrent(_ state: [String: Any], _ stamp: Int) throws {
        let current = context()
        guard current.0, current.1 == stamp, state["generation"] as? Int == vault?.snapshot()["generation"] as? Int else { throw AuthFailure.code("AUTH_CONTEXT_CHANGED") }
    }
    private func json(_ object: [String: Any]) throws -> String { String(decoding: try JSONSerialization.data(withJSONObject: object), as: UTF8.self) }
    private func body(_ reply: NativeReply) throws -> [String: Any] {
        guard let object = try JSONSerialization.jsonObject(with: reply.bytes) as? [String: Any] else { throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        guard (200..<300).contains(reply.status) else {
            let code = object["error_code"] as? String ?? ""
            throw AuthFailure.code(code.range(of: "^AUTH_[A-Z_]{1,80}$", options: .regularExpression) == nil ? "AUTH_NATIVE_UNAVAILABLE" : code)
        }
        return object
    }
    private func publicUser(_ raw: [String: Any], generation: Int) throws -> [String: Any] {
        guard let owner = raw["user_id"] as? String, UUID(uuidString: owner) != nil, let session = raw["session"] as? [String: Any],
              let id = session["id"] as? String, UUID(uuidString: id) != nil,
              let device = session["device_id"] as? String, let expiry = session["expires_at"] as? String else { throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        return ["user_id": owner, "user": ["id": owner, "phone": NSNull()],
                "session": ["id": id, "device_id": device, "expires_at": expiry, "created_at": session["created_at"] ?? ""], "native_generation": generation]
    }
    private func clearCredential(_ state: [String: Any], _ vault: AuthVault) throws {
        let generation = (state["generation"] as? Int ?? 0) + 1
        var next: [String: Any] = ["binding": state["binding"] ?? "", "generation": generation]
        if let pending = state["logout"] { next["completedLogout"] = pending }
        try purgeCache(); try vault.replace(next); closeAll(); mask(); changed("invalidated", generation)
    }
    private func changed(_ reason: String, _ generation: Int = 0) { notifyListeners("nativeAuthChanged", data: ["reason": reason, "generation": generation]) }
    @objc func status(_ call: CAPPluginCall) {
        call.resolve(["available": network != nil && vault != nil, "platform": "ios", "apiOrigin": network?.origin ?? "", "generation": vault?.snapshot()["generation"] ?? 0])
    }
    @objc func getConfig(_ call: CAPPluginCall) { execute(call) { network, _ in try network.perform(network.request(path: "/auth/config")).object } }
    @objc func getCurrentUser(_ call: CAPPluginCall) { execute(call) { network, vault in
        let state = vault.snapshot(), stamp = self.context().1
        if let pending = state["logout"] as? [String: Any] { try self.finishLogout(state, pending, network, vault); throw AuthFailure.code("AUTH_SESSION_EXPIRED") }
        guard self.context().0 else { throw AuthFailure.code("AUTH_CONTEXT_UNCONFIRMED") }
        guard state["credential"] != nil else { self.confirm(stamp); throw AuthFailure.code("AUTH_SESSION_EXPIRED") }
        let reply = try network.perform(network.request(path: "/me", state: state)); try self.stillCurrent(state, stamp)
        if reply.status == 401 { try self.clearCredential(state, vault); throw AuthFailure.code("AUTH_SESSION_EXPIRED") }
        let user = try self.publicUser(self.body(reply), generation: state["generation"] as? Int ?? 0)
        guard user["user_id"] as? String == state["ownerId"] as? String,
              (user["session"] as? [String: Any])?["id"] as? String == state["sessionId"] as? String else { throw AuthFailure.code("AUTH_CONTEXT_CHANGED") }
        self.confirm(stamp); return user
    } }
    @objc func startOtp(_ call: CAPPluginCall) { execute(call) { network, vault in
        let state = try self.qualify(call, vault), stamp = self.context().1
        guard let input = call.getObject("request") else { throw AuthFailure.code("AUTH_PARAMS_INVALID") }
        let reply = try network.perform(network.request(path: "/auth/native/otp/start", method: "POST", body: self.json(input), state: state, binding: true, expected: self.expected(state)))
        try self.stillCurrent(state, stamp); return reply.object
    } }
    @objc func verifyOtp(_ call: CAPPluginCall) { execute(call) { network, vault in
        let state = try self.qualify(call, vault), stamp = self.context().1
        guard let input = call.getObject("request") else { throw AuthFailure.code("AUTH_PARAMS_INVALID") }
        let raw = try self.body(network.perform(network.request(path: "/auth/native/otp/verify", method: "POST", body: self.json(input), state: state, binding: true, expected: self.expected(state))))
        try self.stillCurrent(state, stamp)
        guard let credential = raw["native_session_credential"] as? String, credential.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil else { throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        let generation = (state["generation"] as? Int ?? 0) + 1, user = try self.publicUser(raw, generation: generation)
        var next = state; next["credential"] = credential; next["ownerId"] = user["user_id"]; next["sessionId"] = (user["session"] as? [String: Any])?["id"]; next["generation"] = generation; next.removeValue(forKey: "logout")
        try self.purgeCache(); try vault.replace(next); self.confirm(-1); self.closeAll(); self.mask(); return user
    } }
    @objc func logout(_ call: CAPPluginCall) { execute(call) { network, vault in
        var state = vault.snapshot()
        guard let supplied = call.getObject("expected"), let operation = call.getString("operationId"), UUID(uuidString: operation) != nil else { throw AuthFailure.code("AUTH_PARAMS_INVALID") }
        if let completed = state["completedLogout"] as? [String: Any], completed["operationId"] as? String == operation,
           NSDictionary(dictionary: completed["expected"] as? [String: Any] ?? [:]).isEqual(to: supplied) { return ["ok": true] }
        if state["logout"] == nil { _ = try self.qualify(call, vault); state["logout"] = ["operationId": operation, "expected": supplied]; try vault.replace(state) }
        guard let pending = state["logout"] as? [String: Any], pending["operationId"] as? String == operation,
              NSDictionary(dictionary: pending["expected"] as? [String: Any] ?? [:]).isEqual(to: supplied) else { throw AuthFailure.code("AUTH_CONTEXT_CHANGED") }
        try self.finishLogout(state, pending, network, vault); return ["ok": true]
    } }
    private func finishLogout(_ state: [String: Any], _ pending: [String: Any], _ network: AuthNetwork, _ vault: AuthVault) throws {
        guard context().0, let operation = pending["operationId"] as? String, let supplied = pending["expected"] as? [String: Any] else { throw AuthFailure.code("AUTH_LOGOUT_UNCONFIRMED") }
        let stamp = context().1
        let reply = try body(network.perform(network.request(path: "/logout", method: "POST", body: json(["operation_id": operation]), state: state, expected: supplied)))
        try stillCurrent(state, stamp); guard reply["ok"] as? Bool == true else { throw AuthFailure.code("AUTH_NATIVE_UNAVAILABLE") }
        try clearCredential(state, vault)
    }
    @objc func request(_ call: CAPPluginCall) {
        guard let id = call.getString("requestId"), UUID(uuidString: id) != nil, network != nil, vault != nil else { call.reject("Invalid native request", "AUTH_PARAMS_INVALID"); return }
        let control = NativeRequestControl()
        requestLock.lock()
        guard requests.count < 64, requests[id] == nil else { requestLock.unlock(); call.reject("Native request unavailable", "AUTH_NATIVE_UNAVAILABLE"); return }
        requests[id] = control; requestLock.unlock()
        execute(call) { network, vault in
            defer { self.requestLock.lock(); self.requests.removeValue(forKey: id); self.requestLock.unlock() }
            self.requestLock.lock(); let cancelled = control.cancelled; self.requestLock.unlock()
            guard !cancelled else { throw AuthFailure.code("AUTH_REQUEST_CANCELLED") }
            let state = try self.qualify(call, vault), stamp = self.context().1
            guard let path = call.getString("path") else { throw AuthFailure.code("AUTH_PARAMS_INVALID") }; try network.businessPath(path)
            let request = try network.request(path: path, method: call.getString("method") ?? "GET", body: call.getString("body"), state: state, expected: self.expected(state), idempotency: call.getObject("headers")?["Idempotency-Key"] as? String)
            let exchange = HttpExchange(maxBytes: 2 * 1024 * 1024)
            self.requestLock.lock(); control.exchange = exchange
            if control.cancelled { self.requestLock.unlock(); throw AuthFailure.code("AUTH_REQUEST_CANCELLED") }
            exchange.start(request); self.requestLock.unlock()
            let reply = try exchange.wait()
            self.requestLock.lock(); let lateCancelled = control.cancelled; self.requestLock.unlock()
            guard !lateCancelled else { throw AuthFailure.code("AUTH_REQUEST_CANCELLED") }
            try self.stillCurrent(state, stamp); return reply.object
        }
    }
    @objc func cancelRequest(_ call: CAPPluginCall) {
        if let id = call.getString("requestId") { requestLock.lock(); let control = requests[id]; control?.cancelled = true; control?.exchange?.cancel(); requestLock.unlock() }; call.resolve()
    }
    private func stream(_ id: String) -> NativeStream? { streamLock.lock(); defer { streamLock.unlock() }; return subscriptions[id] }
    private func removeStream(_ id: String) -> NativeStream? { streamLock.lock(); defer { streamLock.unlock() }; return subscriptions.removeValue(forKey: id) }
    private func closeAll() {
        streamLock.lock(); let old = Array(subscriptions.values); subscriptions.removeAll(); streamLock.unlock(); old.forEach { $0.exchange?.cancel() }
    }
    @objc func openStream(_ call: CAPPluginCall) { execute(call) { network, vault in
        let state = try self.qualify(call, vault)
        guard let path = call.getString("path"), path.hasPrefix("/sse/") || path.split(separator: "?", maxSplits: 1)[0].hasSuffix("/events") else { throw AuthFailure.code("AUTH_NATIVE_PATH_REJECTED") }
        try network.businessPath(path)
        var request = try network.request(path: path, state: state, expected: self.expected(state)); request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        if let last = call.getString("lastEventId") {
            guard last.range(of: "^[A-Za-z0-9:_-]{1,128}$", options: .regularExpression) != nil else { throw AuthFailure.code("AUTH_PARAMS_INVALID") }
            request.setValue(last, forHTTPHeaderField: "Last-Event-ID")
        }
        self.streamLock.lock(); defer { self.streamLock.unlock() }
        guard self.subscriptions.count < 2 else { throw AuthFailure.code("AUTH_STREAM_LIMIT") }
        let id = UUID().uuidString; self.subscriptions[id] = NativeStream(request: request, state: state, activity: self.context().1); return ["subscriptionId": id]
    } }
    @objc func startStream(_ call: CAPPluginCall) { execute(call) { _, _ in
        guard let id = call.getString("subscriptionId"), let stream = self.stream(id), stream.exchange == nil else { throw AuthFailure.code("AUTH_CONTEXT_CHANGED") }
        try self.stillCurrent(stream.state, stream.activity)
        let exchange = HttpExchange(maxBytes: 262144, stream: { [weak self, weak stream] line in
            guard let self, let stream, self.stream(id) === stream else { return }
            do {
                try self.stillCurrent(stream.state, stream.activity)
                if line.isEmpty {
                    if !stream.data.isEmpty {
                        if Date().timeIntervalSince(stream.window) >= 1 { stream.count = 0; stream.window = Date() }
                        stream.count += 1; guard stream.count <= 100 else { throw AuthFailure.code("AUTH_STREAM_LIMIT") }
                        var event = self.streamEvent(id, stream); event["event"] = stream.event; event["id"] = stream.eventId; event["data"] = String(stream.data.dropLast()); self.notifyListeners("nativeAuthStream", data: event)
                    }
                    stream.data = ""; stream.event = "message"
                } else if line.hasPrefix("data:") {
                    let value = String(line.dropFirst(5)); stream.data += (value.hasPrefix(" ") ? String(value.dropFirst()) : value) + "\n"
                    guard stream.data.utf8.count <= 262144 else { throw AuthFailure.code("AUTH_STREAM_LIMIT") }
                } else if line.hasPrefix("event:") { stream.event = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces) }
                else if line.hasPrefix("id:") { stream.eventId = String(line.dropFirst(3)).trimmingCharacters(in: .whitespaces) }
            } catch { stream.exchange?.cancel() }
        }, closed: { [weak self] in
            guard let self, let stream = self.removeStream(id) else { return }
            var event = self.streamEvent(id, stream); event["closed"] = true; event["error_code"] = "AUTH_STREAM_UNAVAILABLE"; self.notifyListeners("nativeAuthStream", data: event)
        })
        stream.exchange = exchange; exchange.start(stream.request); return [:]
    } }
    private func streamEvent(_ id: String, _ stream: NativeStream) -> [String: Any] {
        ["subscriptionId": id, "ownerId": stream.state["ownerId"] ?? "", "sessionId": stream.state["sessionId"] ?? "", "generation": stream.state["generation"] ?? 0]
    }
    @objc func closeStream(_ call: CAPPluginCall) { if let id = call.getString("subscriptionId") { removeStream(id)?.exchange?.cancel() }; call.resolve() }
    @objc func download(_ call: CAPPluginCall) { execute(call) { network, vault in
        let state = try self.qualify(call, vault), stamp = self.context().1
        guard let path = call.getString("path"), let max = call.getInt("maxBytes"), max > 0, max <= 50 * 1024 * 1024,
              let owner = state["ownerId"] as? String else { throw AuthFailure.code("AUTH_PARAMS_INVALID") }; try network.businessPath(path)
        let reply = try network.perform(network.request(path: path, state: state, expected: self.expected(state)), maxBytes: max)
        let mime = String((reply.headers["Content-Type"] ?? "").split(separator: ";").first ?? "")
        guard reply.status == 200, ["image/png", "image/jpeg", "image/webp", "application/pdf", "application/zip", "application/json"].contains(mime) else { throw AuthFailure.code("AUTH_DOWNLOAD_UNAVAILABLE") }
        let digest = SHA256.hash(data: reply.bytes).map { String(format: "%02x", $0) }.joined()
        if let expected = call.getString("expectedSha256"), expected != digest { throw AuthFailure.code("AUTH_DOWNLOAD_INTEGRITY") }
        try self.stillCurrent(state, stamp)
        let base = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        let folder = base.appendingPathComponent("nomad-auth/\(owner)/\(state["generation"] as? Int ?? 0)", isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let handle = UUID().uuidString
        let file = folder.appendingPathComponent(handle)
        do { try reply.bytes.write(to: file, options: [.atomic, .completeFileProtection]); try self.stillCurrent(state, stamp) }
        catch { try? FileManager.default.removeItem(at: file); throw error }
        return ["handle": handle, "bytes": reply.bytes.count, "sha256": digest, "mimeType": mime]
    } }
    @objc func acknowledgeView(_ call: CAPPluginCall) { let requestedActivity = context().1; execute(call) { _, vault in
        let state = try self.qualify(call, vault), stamp = requestedActivity
        try self.stillCurrent(state, stamp); guard self.confirmation() == stamp else { throw AuthFailure.code("AUTH_CONTEXT_UNCONFIRMED") }
        self.onMain { do { try self.stillCurrent(state, stamp); self.shield?.isHidden = true } catch {} }; return [:]
    } }
    private func confirm(_ stamp: Int) { contextLock.lock(); confirmedActivity = stamp; contextLock.unlock() }
    private func confirmation() -> Int { contextLock.lock(); defer { contextLock.unlock() }; return confirmedActivity }
    private func purgeCache() throws {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("nomad-auth", isDirectory: true)
        if FileManager.default.fileExists(atPath: root.path) { try FileManager.default.removeItem(at: root) }
    }
    private func onMain(_ work: @escaping () -> Void) { if Thread.isMainThread { work() } else { DispatchQueue.main.async(execute: work) } }
    private func mask() { onMain { [weak self] in
        guard let self, let parent = self.bridge?.webView?.superview else { return }
        if self.shield == nil {
            let view = UIView(frame: parent.bounds); view.autoresizingMask = [.flexibleWidth, .flexibleHeight]; view.backgroundColor = .systemBackground
            let label = UILabel(); label.text = "正在确认登录状态"; label.textColor = .label
            let retry = UIButton(type: .system); retry.setTitle("重试确认", for: .normal); retry.addTarget(self, action: #selector(self.retryAuthority), for: .touchUpInside)
            let stack = UIStackView(arrangedSubviews: [label, retry]); stack.axis = .vertical; stack.spacing = 16; stack.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(stack); NSLayoutConstraint.activate([stack.centerXAnchor.constraint(equalTo: view.centerXAnchor), stack.centerYAnchor.constraint(equalTo: view.centerYAnchor)])
            parent.addSubview(view); self.shield = view
        }
        self.shield?.isHidden = false; if let shield = self.shield { parent.bringSubviewToFront(shield) }
    } }
    @objc private func retryAuthority() { changed("resume") }
    private func background() { contextLock.lock(); active = false; confirmedActivity = -1; activity += 1; contextLock.unlock()
        requestLock.lock(); requests.values.forEach { $0.cancelled = true; $0.exchange?.cancel() }; requestLock.unlock()
        closeAll(); mask() }
    private func foreground() { contextLock.lock(); active = true; contextLock.unlock(); mask(); changed("resume") }
}
