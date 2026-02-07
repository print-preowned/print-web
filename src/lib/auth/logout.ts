/**
 * Logout utility
 * Clears all authentication data following PRINT Authorization & Context Model
 */

import { setCookie } from "../cookies";

export function logout() {
  // Clear localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // Clear cookie by setting it to expire
  setCookie("authHeader", "", -1);
  
  // Redirect to appropriate login based on current route
  // Never redirect admin routes to client login
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    const isAdminRoute = currentPath.startsWith("/admin");
    window.location.href = isAdminRoute ? "/admin/login" : "/login";
  }
}

