/** No credential, login-binding secret, Cookie or Authorization value crosses this JS interface. */
export interface NativeExpectedIdentity { ownerId: string; sessionId: string; generation: number }
export interface NativePublicUser {
  user_id: string;
  user: { id: string; phone: string | null };
  session: { id: string; device_id: string; created_at?: string; expires_at: string };
  native_generation: number;
}
export interface NativeResponse { status: number; headers: Record<string, string>; body: string }
export interface NativeOtpStart {
  phone: string; region?: string; request_id: string;
  captcha?: { lot_number: string; captcha_output: string; pass_token: string; gen_time: string };
}
export interface NativeOtpVerify { phone: string; challenge_id: string; otp?: string; code?: string; device_fingerprint?: string; device_id?: string }
export interface NativeStreamEvent {
  subscriptionId: string; ownerId: string; sessionId: string; generation: number;
  event?: string; id?: string; data?: string; closed?: boolean; error_code?: string;
}
export interface NativeListener { remove(): Promise<void> }
export interface NomadNativeAuthPlugin {
  status(): Promise<{ available: boolean; platform: 'android' | 'ios'; apiOrigin: string; generation: number }>;
  getConfig(): Promise<NativeResponse>;
  getCurrentUser(): Promise<NativePublicUser>;
  startOtp(options: { request: NativeOtpStart; expected: NativeExpectedIdentity }): Promise<NativeResponse>;
  verifyOtp(options: { request: NativeOtpVerify; expected: NativeExpectedIdentity }): Promise<NativePublicUser>;
  logout(options: { operationId: string; expected: NativeExpectedIdentity }): Promise<{ ok: boolean }>;
  cancelRequest(options: { requestId: string }): Promise<void>;
  request(options: { requestId: string; path: string; method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: string;
    headers?: { 'Idempotency-Key'?: string }; expected: NativeExpectedIdentity }): Promise<NativeResponse>;
  openStream(options: { path: string; lastEventId?: string; expected: NativeExpectedIdentity }): Promise<{ subscriptionId: string }>;
  startStream(options: { subscriptionId: string }): Promise<void>;
  closeStream(options: { subscriptionId: string }): Promise<void>;
  download(options: { path: string; maxBytes: number; expectedSha256?: string; expected: NativeExpectedIdentity }): Promise<{ handle: string; bytes: number; sha256: string; mimeType: string }>;
  acknowledgeView(options: { expected: NativeExpectedIdentity }): Promise<void>;
  addListener(eventName: 'nativeAuthChanged', listener: (event: { reason: string; generation: number }) => void): Promise<NativeListener>;
  addListener(eventName: 'nativeAuthStream', listener: (event: NativeStreamEvent) => void): Promise<NativeListener>;
}

export declare const NomadNativeAuth: NomadNativeAuthPlugin;
