/**
 * Server-side auth cookie handling.
 * Token is set by API routes with HttpOnly; client never sees it.
 */

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "../cookies";

export { AUTH_COOKIE_NAME };

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function isSecureCookieContext(request?: Request): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  // x-forwarded-proto is the client scheme after TLS is terminated at a
  // proxy. Next still sees HTTP, so we use this to set Secure for an HTTPS
  // tunnel and omit it on localhost. First value is the client hop.
  const proto = request?.headers.get("x-forwarded-proto");
  if (proto) {
    return proto.split(",")[0]?.trim() === "https";
  }
  return false;
}

export function getAuthCookieOptions(request?: Request) {
  return {
    httpOnly: true,
    secure: isSecureCookieContext(request),
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function getAuthCookieClearOptions(request?: Request) {
  return {
    ...getAuthCookieOptions(request),
    maxAge: 0,
  };
}

export function applyAuthCookie(
  response: NextResponse,
  token: string,
  request?: Request,
): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions(request));
  return response;
}

export function applyClearAuthCookie(
  response: NextResponse,
  request?: Request,
): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, "", getAuthCookieClearOptions(request));
  return response;
}

export async function setAuthCookie(token: string, request?: Request) {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions(request));
}

export async function clearAuthCookie(request?: Request) {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, "", getAuthCookieClearOptions(request));
}

export async function getAuthTokenFromRequest(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(AUTH_COOKIE_NAME);
  return cookie?.value ?? null;
}
