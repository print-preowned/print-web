/**
 * Logout utility
 * Clears auth via server (HttpOnly cookie); client never touches the token.
 */

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    window.location.href = isAdminRoute ? "/admin/login" : "/login";
  });
}

