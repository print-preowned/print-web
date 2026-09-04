/**
 * Route Configuration System
 *
 * Centralized route protection configuration following PRINT Authorization & Context Model
 *
 * This eliminates the need to pass props to RouteGuard on every page.
 * Routes are protected based on their path pattern.
 */

import { TokenContext } from "./token";

const PUBLIC_SELLER_SHOP =
  /^\/seller\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\/.*)?$/i;

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
  "/books": { requiredContext: "CUSTOMER" },
  "/books/*": { requiredContext: "CUSTOMER" },
  // Public seller shop (/seller/{uuid}) is matched in getRouteConfig.
  "/cart": {},
  "/checkout": {
    requireAuth: true,
    requiredContext: "CUSTOMER",
    redirectTo: "/login",
  },
  "/orders": {
    requireAuth: true,
    requiredContext: "CUSTOMER",
    redirectTo: "/login",
  },
  "/orders/*": {
    requireAuth: true,
    requiredContext: "CUSTOMER",
    redirectTo: "/login",
  },

  // Seller routes (require SELLER context)
  "/seller/*": {
    requireAuth: true,
    requiredContext: "SELLER",
    redirectTo: "/login",
  },

  // Seller users (require specific privilege)
  "/seller/users": {
    requireAuth: true,
    requiredContext: "SELLER",
    requiredPrivileges: ["READ_USER"], // Example privilege
    redirectTo: "/login",
  },

  // Seller books (require READ_BOOK privilege)
  "/seller/books": {
    requireAuth: true,
    requiredContext: "SELLER",
    requiredPrivileges: ["READ_BOOK"],
    redirectTo: "/login",
  },

  // Seller orders (require READ_ORDER privilege)
  "/seller/orders": {
    requireAuth: true,
    requiredContext: "SELLER",
    requiredPrivileges: ["READ_ORDER"],
    redirectTo: "/login",
  },
  "/seller/orders/*": {
    requireAuth: true,
    requiredContext: "SELLER",
    requiredPrivileges: ["READ_ORDER"],
    redirectTo: "/login",
  },

  // Seller authors (require READ_AUTHOR privilege)
  "/seller/authors": {
    requireAuth: true,
    requiredContext: "SELLER",
    requiredPrivileges: ["READ_AUTHOR"],
    redirectTo: "/login",
  },

  // Seller accounts list
  "/seller/accounts": {
    requireAuth: true,
    requiredContext: "SELLER",
    redirectTo: "/login",
  },

  // Owner-only routes
  "/seller/settings": {
    requireAuth: true,
    requiredContext: "SELLER",
    requireOwner: true,
    redirectTo: "/login",
  },

  // Seller account (current seller details; edit requires owner)
  "/seller/account": {
    requireAuth: true,
    requiredContext: "SELLER",
    redirectTo: "/login",
  },

  // Dashboard (require auth, any context)
  "/seller/dashboard": {
    requireAuth: true,
    requiredContext: "SELLER",
    redirectTo: "/login",
  },

  // Account page (require auth)
  "/account": {
    requiredContext: "CUSTOMER",
    requireAuth: true,
    redirectTo: "/login",
  },
  "/account/addresses": {
    requireAuth: true,
    requiredContext: "CUSTOMER",
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

  // Invite acceptance and rejection (public)
  "/admin/invite/accept": {},
  "/admin/invite/reject": {},

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

  // Public shop: /seller/{uuid} must not inherit /seller/* SELLER auth
  if (PUBLIC_SELLER_SHOP.test(pathname)) {
    return { requiredContext: "CUSTOMER" };
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
      requiredContext: "SELLER",
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

