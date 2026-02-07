"use client";

/**
 * Protected Layout Component
 * 
 * Automatically applies route protection based on route configuration.
 * No need to pass props - it reads from the route config.
 * 
 * Usage: Wrap layouts with this component instead of RouteGuard
 */

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { getRouteConfig } from "@/lib/auth/routes";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, decodedToken, context, isLoading } = useAuth();
  const routeConfig = getRouteConfig(pathname);

  useEffect(() => {
    if (isLoading || !routeConfig) return;

    // Skip if route is public
    if (routeConfig.public) {
      return;
    }

    // Check authentication
    if (routeConfig.requireAuth && !token) {
      // Use configured redirect, or default based on route path
      const redirectTo = routeConfig.redirectTo || 
        (pathname.startsWith("/admin") ? "/admin/login" : "/login");
      router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check context requirement
    if (
      routeConfig.requireAuth &&
      routeConfig.requiredContext &&
      context !== routeConfig.requiredContext
    ) {
      // Redirect based on context requirement
      if (routeConfig.requiredContext === "PLATFORM" || pathname.startsWith("/admin")) {
        // Admin route requires PLATFORM context - redirect to admin login
        // Never redirect to client routes from admin routes
        router.push("/admin/login");
      } else if (context === "PLATFORM") {
        // Platform user trying to access non-platform route - redirect to admin dashboard
        router.push("/admin/dashboard");
      } else if (routeConfig.requiredContext === "BUSINESS") {
        router.push("/seller/dashboard");
      } else {
        // CUSTOMER context - redirect to home (only if not platform user)
        router.push("/");
      }
      return;
    }

    // Check privileges (BUSINESS context only)
    if (
      routeConfig.requireAuth &&
      context === "BUSINESS" &&
      decodedToken &&
      decodedToken.ctx === "BUSINESS" &&
      routeConfig.requiredPrivileges &&
      routeConfig.requiredPrivileges.length > 0
    ) {
      const hasAllPrivileges = routeConfig.requiredPrivileges.every(
        (privilege) => decodedToken.business.privileges.includes(privilege)
      );
      if (!hasAllPrivileges) {
        router.push("/seller/dashboard");
        return;
      }
    }

    // Check owner requirement
    if (
      routeConfig.requireAuth &&
      routeConfig.requireOwner &&
      context === "BUSINESS" &&
      decodedToken &&
      decodedToken.ctx === "BUSINESS" &&
      !decodedToken.business.is_owner
    ) {
      router.push("/seller/dashboard");
      return;
    }
  }, [
    isLoading,
    token,
    context,
    decodedToken,
    routeConfig,
    router,
    pathname,
  ]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Prevent platform users from accessing client routes
  if (context === "PLATFORM" && !pathname.startsWith("/admin")) {
    // Immediately redirect platform users to admin dashboard, never to client routes
    router.push("/admin/dashboard");
    return null;
  }

  // Prevent client users from accessing admin routes
  if (pathname.startsWith("/admin") && context !== "PLATFORM" && context !== null) {
    // Immediately redirect non-platform users away from admin routes to admin login
    router.push("/admin/login");
    return null;
  }

  // Show nothing while redirecting (checks happen in useEffect)
  if (
    routeConfig &&
    routeConfig.requireAuth &&
    !routeConfig.public &&
    !token
  ) {
    return null;
  }

  if (
    routeConfig &&
    routeConfig.requireAuth &&
    routeConfig.requiredContext &&
    context !== routeConfig.requiredContext
  ) {
    return null;
  }

  if (
    routeConfig &&
    routeConfig.requireAuth &&
    context === "BUSINESS" &&
    decodedToken &&
    decodedToken.ctx === "BUSINESS"
  ) {
    if (
      routeConfig.requiredPrivileges &&
      routeConfig.requiredPrivileges.length > 0
    ) {
      const hasAllPrivileges = routeConfig.requiredPrivileges.every(
        (privilege) => decodedToken.business.privileges.includes(privilege)
      );
      if (!hasAllPrivileges) {
        return null;
      }
    }

    if (routeConfig.requireOwner && !decodedToken.business.is_owner) {
      return null;
    }
  }

  return <>{children}</>;
}

