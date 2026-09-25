# ADR: Native authentication transport for Story 1.0

Status: accepted implementation direction; native implementation/device validation in progress.
Date: 2026-09-19. Basis: user-approved Capacitor scope change and coordination with the App-host task.

## Boundary and ownership

The plugin package and authentication API are owned by Story1.0. Story9.1 owns the app projects,
Capacitor configuration, installation host and lifecycle integration. The Capacitor registration
name is **NomadNativeAuth**. It reads **plugins.NomadNativeAuth.apiOrigin** from the bundled native
configuration; this must be an explicit HTTPS origin without userinfo/query/fragment. An optional
**apiBasePath** is a fixed path prefix, default `/api`. JavaScript cannot change either at runtime.
An absent native implementation/configuration reports unavailable and never uses web cookies.

## One authority, separate transports

Web keeps Secure/HttpOnly `__Host-nomad-sid-{publicSessionId}` cookie family, strict browser Origin/CSRF policy and page-bound
expected public owner/session references. Native uses dedicated `/auth/native/otp/start` and
`/auth/native/otp/verify`, an opaque Bearer credential, and the same PostgreSQL owner/session/
qualification/revocation authority. Native requests never send ambient Cookies; the server rejects
mixed channels and does not infer authentication from platform or device headers. Browser HTTP(S)
origins cannot use the native credential-returning endpoints, which also require HTTPS and JSON.
Native sessions are separated by persisted transport and API audience. API, SSE and download use
one native credential, with `X-Nomad-Auth-Audience` matching the configured API origin, only against the fixed origin; cross-origin redirects are refused.

## Login and credential storage

The native plugin generates and securely stores a random login binding secret and supplies it as
`X-Nomad-Login-Binding` only to the fixed authentication API. Web uses its separate HttpOnly login
cookie. Both paths bind request ID, phone, proof, client generation and initial session context.
The native verification response may carry a one-time `native_session_credential` over HTTPS;
the plugin stores it before resolving, strips it and all binding secrets from its JS result, then
the UI confirms identity through `/me`. Generic JS `request` must reject authentication routes,
so it cannot be used to retrieve an unfiltered credential response.

iOS storage uses Keychain with device-only accessibility; Android uses an Android Keystore key
and authenticated encryption over private preference bytes. Neither stores plaintext credentials
in Web storage, URLs, logs, build configuration or public DTOs. Local metadata is never authority:
cold start, foreground and restoration recheck `/me`. Network failures keep authority unknown;
confirmed invalidation clears applicable credentials/private caches.

Native generation fences outgoing work and late results; caller-provided expected owner/session/
generation must match the native-held context. Backend client generations additionally prevent
late login completion or old responses from resurrecting an earlier session. Current logout uses
the same durable operation receipt as Web; deleting local credentials is not proof of revocation.
Confirming an old logout must not clear a newer account's native state.

## Host and proof selection

Initial native validation will evaluate PNVS H5-in-WebView with the explicitly registered H5
scheme and `https: true`; the vendored loader otherwise inherits the local WebView scheme.
Android/iOS PNVS native schemes remain separate available resources. Use the matching native SDK
only if the evaluated H5 path requires it, with its actual platform credentials and server verifier.
No provider secret is bundled. External/login callbacks are untrusted: currently unimplemented
third-party methods cannot acquire a session from a callback URL or SDK success marker.

## Streams, files and UI

Native HTTP, streaming and file download inject the private bearer internally. Only relative
approved API paths and safe caller headers are accepted; redirects do not forward authentication.
Streams have bounded buffers, lifecycle cancellation and generation-filtered event delivery.
Downloads enforce limits/type/integrity and use owner-scoped temporary files, returning an opaque
handle rather than a credential-bearing URL. This does not implement the future export/gallery
product features. Native privacy shielding remains until the visible UI acknowledges the verified
public context. `acknowledgeView` cannot unlock a stale owner/session/generation.

## Required evidence

TypeScript declarations, wrapper logs and web tests do not prove native behavior. Closure needs
Android and iOS installed-host checks for secure storage, cold/foreground recovery, wrong origin/
channel, expired/revoked credentials, callback replay, concurrent logout/login, SSE and private
download boundaries. Actual PNVS and U-App/U-Link evidence remains separate. APK/TestFlight final
distribution belongs to9.2; no public-cloud publication follows from this package preparation.


## Android dependency compatibility decision (2026-09-19)

OkHttp5.5.0 was rejected by the actual AAR check because it requires compileSdk37; the current
Capacitor8.5.2/AGP8.13.0 host uses compileSdk36. Use pinned OkHttp5.4.0 **Android artifact**:
Maven Central's `okhttp-android-5.4.0.aar` metadata reports minCompileSdk36 (5.3.2 reports1).
No AAR check is disabled and no JVM-artifact substitution is used. Upstream5.4 includes the bounded
HTTP/2-header fix. The5.5 differences were reviewed: the optional API37 ECH/DNS feature is not used;
Nomad uses fixed DNS-name HTTPS origins, rejects IP-literal origins, follows no redirects, sends bounded
JSON rather than multipart/QUERY, and explicitly bounds connection/write/read/whole-call timeouts.
This is a compatibility choice, not a claim that5.4 equals5.5 or has completed a security certification.
Source: https://github.com/lysine-dev/okhttp/blob/main/CHANGELOG.md ; actual metadata downloaded from
https://repo.maven.apache.org/maven2/com/squareup/okhttp3/okhttp-android/5.4.0/okhttp-android-5.4.0.aar .
Both native implementations normalize lowercase DNS host/default443 and partition secure storage by
that canonical origin plus fixed API base path; changing an environment cannot send its old credential
to the new environment. HTTPS hostname/certificate verification remains enabled.
