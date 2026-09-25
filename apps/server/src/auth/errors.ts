/** Only safe, enumerated error metadata crosses HTTP/log boundaries. Never retain an SDK error. */
export class AuthFault extends Error {
  constructor(
    readonly code: string,
    readonly status = 401,
    readonly retriable = false,
    readonly details?: { retry_after_sec?: number; challenge_id?: string },
  ) {
    super(code);
    this.name = 'AuthFault';
  }
}

export async function authAuthority<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    if (error instanceof AuthFault) throw error;
    throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
  }
}
