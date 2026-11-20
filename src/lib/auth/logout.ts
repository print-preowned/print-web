/**
 * Logout utility
 * Clears auth via server (HttpOnly cookie); client never touches the token.
 * Signing out ends only the section this page belongs to.
 *
 * MDC-CS: 401 on API calls → force logout (see apiFetch). 403 responses stay
 * in the current context and are shown as a dismissible access banner.
 */

import { LOGIN_PATH } from "../sections";

export const AUTH_FORCE_LOGOUT_EVENT = "print:auth-force-logout";

/** Ends this section's session on the API and clears its cookie. */
export async function endSectionSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // The caller redirects either way.
  }
}

/** Clears React session immediately, then clears cookie and redirects. */
async function logoutAndRedirect(hasExpiredSession = true): Promise<void> {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
  await endSectionSession();

  window.location.href = hasExpiredSession ? `${LOGIN_PATH}?reason=session_expired` : LOGIN_PATH;
}

export async function forceLogout() {
  await logoutAndRedirect();
}

export function logout() {
  logoutAndRedirect(false);
}
