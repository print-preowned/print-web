"use client";

/**
 * Route Guard Component
 * 
 * Following MDC-FE-ROUTE-1: route_guard_present
 * Following MDC-FE-ROUTE-2: no unguarded_routes
 * 
 * Protects routes based on:
 * - Authentication status
 * - Required context (CUSTOMER or BUSINESS)
 * - Required privileges (for BUSINESS context)
 */

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { TokenContext } from "@/lib/auth/token";

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredContext?: TokenContext;
  requiredPrivileges?: string[];
  requireOwner?: boolean;
  redirectTo?: string;
}

export function RouteGuard({
  children,
  requireAuth = true,
  requiredContext,
  requiredPrivileges = [],
  requireOwner = false,
  redirectTo,
}: RouteGuardProps) {
  const { session, context, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (requireAuth && !session) {
      router.push(redirectTo || "/login");
      return;
    }

    // Check context requirement
    if (requireAuth && requiredContext && context !== requiredContext) {
      // Prevent cross-context access - redirect to appropriate login based on current context
      if (context === "PLATFORM") {
        // Platform user trying to access non-platform route - redirect to admin login
        router.push("/admin/login");
      } else if (requiredContext === "PLATFORM") {
        // Non-platform user trying to access platform route - redirect to admin login
        router.push("/admin/login");
      } else if (pathname.startsWith("/admin")) {
        // Any user trying to access admin route without PLATFORM context - redirect to admin login
        router.push("/admin/login");
      } else if (requiredContext === "BUSINESS") {
        // Customer trying to access business route - redirect to client login
        router.push("/login");
      } else {
        // Business user trying to access customer route - redirect to client login
        router.push("/login");
      }
      return;
    }

    // Check privileges (BUSINESS context only)
    if (
      requireAuth &&
      context === "BUSINESS" &&
      session &&
      session.context === "BUSINESS" &&
      session.business
    ) {
      // Check required privileges
      if (requiredPrivileges.length > 0) {
        const hasAllPrivileges = requiredPrivileges.every((privilege) =>
          session.business!.privileges.includes(privilege)
        );
        if (!hasAllPrivileges) {
          router.push("/seller/dashboard"); // Or appropriate error page
          return;
        }
      }

      // Check owner requirement
      if (requireOwner && !session.business.is_owner) {
        router.push("/seller/dashboard"); // Or appropriate error page
        return;
      }
    }
  }, [
    isLoading,
    session,
    context,
    session,
    requireAuth,
    requiredContext,
    requiredPrivileges,
    requireOwner,
    router,
    redirectTo,
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

  // Show nothing while redirecting
  if (requireAuth && !session) {
    return null;
  }

  if (requireAuth && requiredContext && context !== requiredContext) {
    return null;
  }

  // Prevent platform users from accessing client routes
  if (context === "PLATFORM" && !pathname.startsWith("/admin")) {
    // Always redirect platform users to admin dashboard, never to client routes
    router.push("/admin/dashboard");
    return null;
  }

  // Prevent client users from accessing admin routes
  if (pathname.startsWith("/admin") && context !== "PLATFORM" && context !== null) {
    // Always redirect non-platform users away from admin routes to admin login
    router.push("/admin/login");
    return null;
  }

  if (
    requireAuth &&
    context === "BUSINESS" &&
    session?.context === "BUSINESS" &&
    session.business
  ) {
    if (requiredPrivileges.length > 0) {
      const hasAllPrivileges = requiredPrivileges.every((privilege) =>
        session.business!.privileges.includes(privilege)
      );
      if (!hasAllPrivileges) {
        return null;
      }
    }

    if (requireOwner && !session.business.is_owner) {
      return null;
    }
  }

  return <>{children}</>;
}

