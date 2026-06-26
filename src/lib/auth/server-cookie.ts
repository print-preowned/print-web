/**
 * Server-side auth cookie handling.
 * Token is set by API routes with HttpOnly; client never sees it.
 */

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "../cookies";

export { AUTH_COOKIE_NAME };

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Parse auth token from a Cookie header string (e.g. context.req.headers.cookie).
 * Use when you have the raw header and need the token (e.g. SSR / apiFetch with context).
 */
// export function getAuthTokenFromCookieHeader(cookieHeader: string | undefined): string | null {
//   if (!cookieHeader) return null;
//   const nameEQ = `${AUTH_COOKIE_NAME}=`;
//   const parts = cookieHeader.split(";");
//   for (let i = 0; i < parts.length; i += 1) {
//     let part = parts[i];
//     while (part.charAt(0) === " ") part = part.slice(1);
//     if (part.indexOf(nameEQ) === 0) return part.slice(nameEQ.length);
//   }
//   return null;
// }

export function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}

export async function getAuthTokenFromRequest(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(AUTH_COOKIE_NAME);
  return cookie?.value ?? null;
}
