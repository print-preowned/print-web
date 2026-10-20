/**
 * Logout utility
 * Clears auth via server (HttpOnly cookie); client never touches the token.
 *
 * MDC-CS: 401 on API calls → force logout (see apiFetch). 403 responses stay
 * in the current context and are shown as a dismissible access banner.
 */

export const AUTH_FORCE_LOGOUT_EVENT = "print:auth-force-logout";

function redirectToLogin() {
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const loginPath = isAdminRoute ? "/admin/login" : "/login";
  window.location.href = `${loginPath}?reason=session_expired`;
}

/** Clears React session immediately, then clears cookie and redirects. */
export async function forceLogout(): Promise<void> {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // Redirect even if the logout request fails.
  }
  redirectToLogin();
}

export function logout() {
  void forceLogout();
}
