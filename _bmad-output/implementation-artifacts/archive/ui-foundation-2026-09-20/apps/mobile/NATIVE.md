# Native host development

Story 9.1 adds a shared Capacitor host; Story 1.0 owns `packages/native-auth`, and 9.2 owns final signed APK / TestFlight delivery. This file describes developer commands, not completed device acceptance.

Use WSL Node 22 and the workspace pnpm. This checkout's existing store is `/tmp/nomad-sp-pnpm-store`; use `pnpm --config.store-dir=/tmp/nomad-sp-pnpm-store` when pnpm would otherwise choose another store. Do not use the Windows Gradle executable on PATH. iOS native compilation needs the designated macOS/Xcode environment.

## Public build configuration

| Variable | Meaning |
| --- | --- |
| `NOMAD_NATIVE_ENV` | `development` (default), `staging`, or `release` |
| `NOMAD_NATIVE_APP_ID` | Explicit application identity; development alone may use `dev.nomad.mvp` |
| `NOMAD_NATIVE_API_ORIGIN` | Exact HTTPS DNS-name origin, with no IP literal, `/api`, userinfo, query or fragment |
| `NOMAD_NATIVE_API_BASE_PATH` | Separate API prefix, default `/api` |
| `NOMAD_NATIVE_INCLUDE_AUTH` | Default `1`; explicit `0` is allowed only for foundation development while the native auth implementation is unavailable |

Only these public settings enter Capacitor configuration. Never load server/admin env files into Vite/Capacitor. Empty API in development intentionally leaves native authentication unavailable. A supplied ID does not prove provider registration or signing. The development namespace is not a release identity; verify actual PNVS/U-App/Apple/WeChat registrations and signing continuity before finalizing it.

The native auth plugin consumes `plugins.NomadNativeAuth.apiOrigin` and `apiBasePath`; JavaScript cannot select arbitrary authenticated destinations. See `packages/native-auth/ADR.md` for its wire and secure-store boundary. No credential belongs in Preferences/localStorage, URL, application config or logs.

A foundation-only build has no native authentication and cannot satisfy Story1.0 or final release gates. Always sync again with authentication included once its native implementation is ready; `native:verify` deliberately requires that registration. The explicit development option does not permit a browser-cookie or test-identity fallback.

## Build and synchronize

Run from this workspace, after dependency coordination with the authentication task:

```bash
pnpm -F nomad-mobile run native:preflight
pnpm -F nomad-mobile run build
pnpm -F nomad-mobile exec cap sync android
pnpm -F nomad-mobile exec cap sync ios
pnpm -F nomad-mobile run native:verify
```

`native:preflight` is a read-only inventory; exit 0 means valid configuration, not ready signing/install. `native:verify` checks generated configuration and copied assets, not native compilation or runtime. Keep both distinctions in Story evidence.

Android uses Linux JDK21, Android SDK platform/build-tools36 and the project's Gradle wrapper. Set `JAVA_HOME`, `ANDROID_HOME` and a writable `GRADLE_USER_HOME` for the chosen local tool installation. From `apps/mobile/android`, run `./gradlew --no-daemon assembleDebug` for the explicitly local development candidate. Final release/signing configurations and replacement of development identities remain 9.2's checked work, not a claim made by debug compilation.

For iOS, transfer a controlled source revision/content manifest and lockfile to the macOS workspace, install its dependencies there, build Web assets and sync the SPM project, resolve native packages, then compile/sign/install through Xcode. Do not copy Linux node_modules to macOS. Preserve SceneDelegate/UIScene URL and lifecycle forwarding. Actual profiles, Team, devices and TestFlight group/build must be verified; WSL source generation cannot establish them.

## Shared host interfaces

`src/platform/host.ts` exports native host detection, prioritized back-handler registration, native foreground and untrusted URL subscriptions, safe external opening, and sanitized problem codes. `HostBootstrap` owns startup leases and StrictMode cleanup. Root App handles page navigation; each existing Sheet/modal must register a higher-priority handler so busy/draft states consume back without falling through. The authentication task maintains those existing components.

Web transport and browser device/UI detection remain distinct from Capacitor host detection. Native resume does not duplicate browser pageshow/bfcache handlers. An external-open acknowledgement is not authentication, feedback submission or share receipt; `unconfirmed` is not proven failure or success.

Android minimum OS is API29, with WebView111+ for the current bundle. Older engines use the bundled recovery page. Vite explicitly targets Safari/iOS16.0; syntax targets do not polyfill every Web API or prove device compatibility. Shared inset tokens are consumed by each existing page/footer, not padded again on html/root.

## Remaining real evidence

Native OS/WebView/keyboard/back/safe-area/network/permission behavior requires actual devices. Signed APK, TestFlight processing/availability, installation/upgrades and real identity/provider/analytics are separate evidence. Keep incomplete Tasks open and use `app_delivery_evidence` only for verified runtime records; never label configuration checks or mocks as installed App proof.
