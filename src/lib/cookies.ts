/**
 * The auth token lives in an HttpOnly cookie, so it is never readable or
 * writable from client-side JS. All reads and writes happen server-side in
 * src/lib/auth/server-cookie.ts; this file only owns the shared name.
 *
 * Each section has its own host and these cookies set no Domain, so a host
 * only ever holds its own section's session. In production the `__Host-`
 * prefix makes browsers enforce that. The prefix requires Secure, so local
 * http runs go without it.
 */
const PREFIX = process.env.NODE_ENV === "production" ? "__Host-" : "";

/** Single source of truth for the auth token cookie name */
export const AUTH_COOKIE_NAME = `${PREFIX}authToken`;

/** Non-authoritative display profile shared with server and client rendering. */
export const PROFILE_COOKIE_NAME = `${PREFIX}userProfile`;
