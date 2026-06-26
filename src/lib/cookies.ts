/**
 * Cookie utilities. Auth token is stored in cookie only (no localStorage).
 *
 * Security: Secure in production, SameSite=Strict, path=/, bounded expiry.
 * Note: HttpOnly cannot be set from client-side JS; for HttpOnly you’d set the
 * cookie from a server response (e.g. API route or middleware).
 */

/** Single source of truth for the auth token cookie name */
export const AUTH_COOKIE_NAME = "authToken";

const MAX_AGE_DAYS = 7;
const PAST_EXPIRY = "Thu, 01 Jan 1970 00:00:00 UTC";

function isSecureContext(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production";
  }
  return window.location?.protocol === "https:" || process.env.NODE_ENV === "production";
}

export function getCookie(key: string, cookiesSource = "") {
  const cookiesList =
    typeof window === "undefined" ? cookiesSource : document.cookie;

  if (!cookiesList) {
    return null;
  }

  const nameEQ = `${key}=`;
  const cookies = cookiesList.split(";");

  for (let i = 0; i < cookies.length; i += 1) {
    let cookie = cookies[i];

    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }

    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }

  return null;
}

/**
 * Set a cookie with security attributes.
 * - path=/
 * - SameSite=Strict (CSRF protection)
 * - Secure in production or when page is HTTPS
 * - Bounded expiry (days)
 */
export function setCookie(key: string, value: string, days: number = MAX_AGE_DAYS) {
  if (typeof window === "undefined") {
    return;
  }
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const parts = [
    `${key}=${value}`,
    `expires=${expires.toUTCString()}`,
    "path=/",
    "SameSite=Strict",
  ];
  if (isSecureContext()) {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}

/**
 * Clear the auth cookie (same path/attributes so browser removes it).
 * Call on logout and when invalidating the session.
 */
export function clearAuthCookie() {
  if (typeof window === "undefined") {
    return;
  }
  const parts = [`${AUTH_COOKIE_NAME}=`, `expires=${PAST_EXPIRY}`, "path=/", "SameSite=Strict"];
  if (isSecureContext()) {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}