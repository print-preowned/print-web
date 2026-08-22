/**
 * The auth token lives in an HttpOnly cookie, so it is never readable or
 * writable from client-side JS. All reads and writes happen server-side in
 * src/lib/auth/server-cookie.ts; this file only owns the shared name.
 */

/** Single source of truth for the auth token cookie name */
export const AUTH_COOKIE_NAME = "authToken";
