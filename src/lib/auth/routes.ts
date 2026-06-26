/**
 * Route Configuration System
 * 
 * Centralized route protection configuration following PRINT Authorization & Context Model
 * 
 * This eliminates the need to pass props to RouteGuard on every page.
 * Routes are protected based on their path pattern.
 */

import { TokenContext } from "./token";

export interface RouteConfig {
  /** If true, route requires a valid token; if false/omitted, route is public */
  requireAuth?: boolean;
  requiredContext?: TokenContext;
  requiredPrivileges?: string[];
  requireOwner?: boolean;
  redirectTo?: string;
}

/**
 * Route configuration map
 * Keys are path patterns (supports wildcards with *)
 */
export const routeConfig: Record<string, RouteConfig> = {
  // Public routes (no requireAuth)
  "/": {},
  "/login": {},
  "/register": {},
  "/forgot-password": {},
  "/reset-password": {},


  "/change-password": {
    requireAuth: true,
    redirectTo: "/login",
  },
  
  // Customer routes (public access - e-commerce site)
  "/books": {requiredContext: "CUSTOMER"},
  "/books/*": {requiredContext: "CUSTOMER"},
  "/authors": {requiredContext: "CUSTOMER"},
  "/authors/*": {requiredContext: "CUSTOMER"},
  
  // Seller routes (require BUSINESS context)
  "/seller/*": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    redirectTo: "/login",
  },
  
  // Seller users (require specific privilege)
  "/seller/users": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    requiredPrivileges: ["READ_USER"], // Example privilege
    redirectTo: "/login",
  },
  
  // Seller books (require READ_BOOK privilege)
  "/seller/books": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    requiredPrivileges: ["READ_BOOK"],
    redirectTo: "/login",
  },
  
  // Seller authors (require READ_AUTHOR privilege)
  "/seller/authors": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    requiredPrivileges: ["READ_AUTHOR"],
    redirectTo: "/login",
  },
  
  // Seller businesses (require BUSINESS context, owner for delete)
  "/seller/businesses": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    redirectTo: "/login",
  },
  
  // Owner-only routes
  "/seller/settings": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    requireOwner: true,
    redirectTo: "/login",
  },

  // Seller account (business details; edit requires owner)
  "/seller/account": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    redirectTo: "/login",
  },
  
  // Dashboard (require auth, any context)
  "/seller/dashboard": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    redirectTo: "/login",
  },
  
  // Account page (require auth)
  "/account": {
    requiredContext: "CUSTOMER",
    requireAuth: true,
    redirectTo: "/login",
  },
  
  // Admin routes (require PLATFORM context - separate from regular UI)
  "/admin/*": {
    requireAuth: true,
    requiredContext: "PLATFORM",
    redirectTo: "/admin/login",
  },
  
  // Admin login (public)
  "/admin/login": {},

  // Admin password reset (public)
  "/admin/forgot-password": {},
  "/admin/reset-password": {},
  "/admin/change-password": {
    requireAuth: true,
    requiredContext: "PLATFORM",
    redirectTo: "/admin/login",
  },

  // Invite acceptance (public)
  "/admin/invite/accept": {},

  // Admin books pages
  "/admin/books": {
    requireAuth: true,
    requiredContext: "PLATFORM",
    redirectTo: "/admin/login",
  },
  "/admin/books/*": {
    requireAuth: true,
    requiredContext: "PLATFORM",
    redirectTo: "/admin/login",
  },

  // Admin authors pages
  "/admin/authors": {
    requireAuth: true,
    requiredContext: "PLATFORM",
    redirectTo: "/admin/login",
  },
  "/admin/authors/*": {
    requireAuth: true,
    requiredContext: "PLATFORM",
    redirectTo: "/admin/login",
  },
};

/**
 * Get route configuration for a given path
 * Supports wildcard matching
 */
export function getRouteConfig(pathname: string): RouteConfig | null {
  // Exact match first
  if (routeConfig[pathname]) {
    return routeConfig[pathname];
  }
  
  // Wildcard matching
  for (const [pattern, config] of Object.entries(routeConfig)) {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      if (regex.test(pathname)) {
        return config;
      }
    }
  }
  
  // Default: require auth for unknown routes
  // Context-aware default redirect
  if (pathname.startsWith("/admin")) {
    return {
      requireAuth: true,
      requiredContext: "PLATFORM",
      redirectTo: "/admin/login",
    };
  } else if (pathname.startsWith("/seller")) {
    return {
      requireAuth: true,
      requiredContext: "BUSINESS",
      redirectTo: "/login",
    };
  } else {
    return {
      requireAuth: true,
      redirectTo: "/login",
    };
  }
}

/**
 * Check if a route is public (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
  const config = getRouteConfig(pathname);
  return config != null && config.requireAuth !== true;
}

/**
 * Check if a route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const config = getRouteConfig(pathname);
  return config?.requireAuth === true;
}

