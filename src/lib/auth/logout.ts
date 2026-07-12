/**
 * Logout utility
 * Clears auth via server (HttpOnly cookie); client never touches the token.
 *
 * MDC-CS: 401/403 on API calls → force logout (see apiFetch).
 */

export const AUTH_FORCE_LOGOUT_EVENT = "print:auth-force-logout";

function redirectToLogin() {
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  window.location.href = isAdminRoute ? "/admin/login" : "/login";
}

/** Clears React session immediately, then clears cookie and redirects. */
export function forceLogout() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
  localStorage.removeItem("user");
  fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(
    redirectToLogin,
  );
}

export function logout() {
  forceLogout();
}

