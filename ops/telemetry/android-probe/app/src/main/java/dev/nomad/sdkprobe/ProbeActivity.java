package dev.nomad.sdkprobe;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.umeng.commonsdk.UMConfigure;
import com.umeng.analytics.MobclickAgent;
import org.json.JSONObject;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

/** Explicit isolated emulator fixture only. Never bundled into Nomad. No real tenant key. */
public final class ProbeActivity extends Activity {
    private final Handler timer = new Handler(Looper.getMainLooper());
    private String nonce;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        nonce = getIntent().getStringExtra("run_nonce");
        if (!android.os.Build.FINGERPRINT.contains("generic") || nonce == null || !nonce.matches("[a-f0-9]{32}")
                || !getIntent().getBooleanExtra("network_isolated", false)) { finish(); return; }
        // The root-only runner MUST install a UID-wide output rejection BEFORE launching this non-exported activity.
        record("before_init");
        UMConfigure.setLogEnabled(false);
        UMConfigure.enableImeiCollection(false); UMConfigure.enableImsiCollection(false);
        UMConfigure.enableIccidCollection(false); UMConfigure.enableWiFiMacCollection(false);
        UMConfigure.enableAplCollection(false); UMConfigure.enableInstallReferrerCollection(false);
        UMConfigure.enablePi(false); UMConfigure.enablePo(false);
        MobclickAgent.setCatchUncaughtExceptions(false);
        MobclickAgent.setPageCollectionMode(MobclickAgent.PageMode.MANUAL);
        UMConfigure.preInit(this, "000000000000000000000000", "nomad_fixture");
        UMConfigure.submitPolicyGrantResult(this, true);
        UMConfigure.init(this, "000000000000000000000000", "nomad_fixture", UMConfigure.DEVICE_TYPE_PHONE, null);
        Map<String, Object> properties = new HashMap<>(); properties.put("source_page", "home"); properties.put("schema_version", "nomad.telemetry.v1");
        MobclickAgent.onEventObject(this, "home_view", properties);
        timer.postDelayed(() -> record("before_disable"), 3000);
        timer.postDelayed(() -> {
            MobclickAgent.disable(); UMConfigure.submitPolicyGrantResult(this, false);
            MobclickAgent.onProfileSignOff(); MobclickAgent.clearPreProperties(this);
            record("disable_calls_returned");
        }, 4000);
        timer.postDelayed(() -> { MobclickAgent.onEventObject(this, "after_revoke_fixture", properties); record("post_disable_event_called"); }, 6000);
        timer.postDelayed(() -> record("after_disable_10s"), 14000);
    }
    private long[] files(File root, int depth) {
        long[] total = {0, 0}; if (depth > 8 || root == null) return total;
        File[] children = root.listFiles(); if (children == null) return total;
        for (File file : children) {
            if (file.isDirectory()) { long[] sub = files(file, depth + 1); total[0] += sub[0]; total[1] += sub[1]; }
            else { total[0]++; total[1] += file.length(); }
        }
        return total;
    }
    private void record(String phase) {
        try {
            int sdkThreads = 0;
            for (StackTraceElement[] stack : Thread.getAllStackTraces().values()) {
                for (StackTraceElement frame : stack) if (frame.getClassName().startsWith("com.umeng.")) { sdkThreads++; break; }
            }
            long[] counts = files(new File(getApplicationInfo().dataDir), 0);
            JSONObject result = new JSONObject(); result.put("run_nonce", nonce); result.put("phase", phase);
            result.put("sdk_initialized_flag", UMConfigure.getInitStatus()); result.put("sdk_threads_observed", sdkThreads);
            result.put("app_data_files", counts[0]); result.put("app_data_bytes", counts[1]);
            result.put("real_tenant_key_used", false); result.put("full_stop_verified", false);
            Log.i("NomadSdkProbe", result.toString());
        } catch (Exception ignored) { Log.i("NomadSdkProbe", "PROBE_OBSERVATION_FAILED"); }
    }
}
