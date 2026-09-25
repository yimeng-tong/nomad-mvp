import Foundation
import Security
import CryptoKit

enum AuthFailure: Error { case code(String) }
final class AuthVault {
    private let lock = NSLock()
    private var state: [String: Any]
    private let query: [String: Any]
    init(audience: String) throws {
        let scope = SHA256.hash(data: Data(audience.utf8)).map { String(format: "%02x", $0) }.joined()
        query = [kSecClass as String: kSecClassGenericPassword,
                 kSecAttrService as String: "\(Bundle.main.bundleIdentifier ?? "nomad").native.auth.v1.\(scope)",
                 kSecAttrAccount as String: "authority", kSecAttrSynchronizable as String: false]
        var read = query; read[kSecReturnData as String] = true; read[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(read as CFDictionary, &result)
        if status == errSecItemNotFound {
            state = ["binding": try Self.randomSecret(), "generation": 0]
            try persist(state, add: true)
        } else if status == errSecSuccess, let data = result as? Data,
                  let decoded = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let binding = decoded["binding"] as? String, binding.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil {
            state = decoded
        } else { throw AuthFailure.code("AUTH_SECURE_STORAGE_UNAVAILABLE") }
    }
    static func randomSecret() throws -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw AuthFailure.code("AUTH_SECURE_STORAGE_UNAVAILABLE") }
        return Data(bytes).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
    func snapshot() -> [String: Any] { lock.lock(); defer { lock.unlock() }; return state }
    func replace(_ next: [String: Any]) throws {
        lock.lock(); defer { lock.unlock() }; try persist(next, add: false); state = next
    }
    private func persist(_ value: [String: Any], add: Bool) throws {
        let attributes: [String: Any] = [kSecValueData as String: try JSONSerialization.data(withJSONObject: value),
                                      kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly]
        let status = add ? SecItemAdd(query.merging(attributes) { _, new in new } as CFDictionary, nil)
                         : SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        guard status == errSecSuccess else { throw AuthFailure.code("AUTH_SECURE_STORAGE_UNAVAILABLE") }
    }
}
