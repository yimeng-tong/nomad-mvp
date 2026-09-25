package dev.nomad.auth;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Only encrypted bytes live in private preferences; the wrapping key is non-exportable Android Keystore material. */
final class AuthVault {
    private final String ALIAS;
    private final SharedPreferences preferences;
    private final SecretKey key;
    private JSONObject state;

    AuthVault(Context context, String audience) throws Exception {
        StringBuilder scope = new StringBuilder();
        for (byte value : java.security.MessageDigest.getInstance("SHA-256").digest(audience.getBytes(StandardCharsets.UTF_8))) scope.append(String.format("%02x", value));
        ALIAS = "nomad.native.auth.v1." + scope;
        preferences = context.getSharedPreferences(ALIAS, Context.MODE_PRIVATE);
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (!store.containsAlias(ALIAS)) {
            // A restored ciphertext without its device key cannot silently become a trusted session.
            if (preferences.contains("sealed")) throw new IllegalStateException("AUTH_SECURE_STORAGE_UNAVAILABLE");
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true).build());
            generator.generateKey();
        }
        key = (SecretKey) store.getKey(ALIAS, null);
        String sealed = preferences.getString("sealed", null);
        if (sealed == null) {
            state = new JSONObject().put("binding", randomSecret()).put("generation", 0);
            persist(state);
        } else {
            byte[] data = Base64.decode(sealed, Base64.NO_WRAP);
            if (data.length < 29) throw new IllegalStateException("AUTH_SECURE_STORAGE_UNAVAILABLE");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, data, 0, 12));
            cipher.updateAAD(ALIAS.getBytes(StandardCharsets.UTF_8));
            state = new JSONObject(new String(cipher.doFinal(data, 12, data.length - 12), StandardCharsets.UTF_8));
            if (!state.optString("binding").matches("[A-Za-z0-9_-]{43}")) throw new IllegalStateException("AUTH_SECURE_STORAGE_UNAVAILABLE");
        }
    }
    static String randomSecret() {
        byte[] data = new byte[32]; new SecureRandom().nextBytes(data);
        return Base64.encodeToString(data, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
    }
    synchronized JSONObject snapshot() throws Exception { return new JSONObject(state.toString()); }
    synchronized void replace(JSONObject next) throws Exception { persist(next); state = new JSONObject(next.toString()); }
    private void persist(JSONObject next) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key);
        cipher.updateAAD(ALIAS.getBytes(StandardCharsets.UTF_8));
        byte[] encrypted = cipher.doFinal(next.toString().getBytes(StandardCharsets.UTF_8));
        byte[] output = new byte[12 + encrypted.length];
        System.arraycopy(cipher.getIV(), 0, output, 0, 12); System.arraycopy(encrypted, 0, output, 12, encrypted.length);
        if (!preferences.edit().putString("sealed", Base64.encodeToString(output, Base64.NO_WRAP)).commit()) throw new IllegalStateException("AUTH_SECURE_STORAGE_UNAVAILABLE");
    }
}
