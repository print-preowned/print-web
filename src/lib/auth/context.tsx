"use client";

/**
 * Session state for one UI section. Each section's layout mounts its own
 * provider, so a page only ever sees the session of the section it is in.
 *
 * Rules:
 * - One section per provider (store, seller or admin), never mixed
 * - Token-based hydration (token stored HttpOnly cookie, never exposed to client)
 * - No authority inference
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AUTH_FORCE_LOGOUT_EVENT } from "./logout";
import { clearUserProfileCookie } from "./profile-cookie";
import { Session, TokenContext } from "./token";
import type { Section } from "../sections";

interface AuthContextValue {
  section: Section;
  session: Session | null;
  context: TokenContext | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  clearAuth: () => void;
  refreshSession: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  section,
  initialSession,
  children,
}: {
  section: Section;
  /** The session the server already verified for this request, if any. */
  initialSession?: Session | null;
  children: ReactNode;
}) {
  const [session, setSessionState] = useState<Session | null>(initialSession ?? null);
  const [isLoading, setIsLoading] = useState(initialSession === undefined);

  const refreshSession = async (): Promise<Session | null> => {
    // After a server route replaces the auth cookie, call this to sync React state.
    // See IMPLEMENTATION.md — "Session refresh vs force logout".
    if (typeof window === "undefined") return null;
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const { session: nextSession } = (await res.json()) as { session: Session };
        setSessionState(nextSession ?? null);
        return nextSession ?? null;
      }
      setSessionState(null);
      return null;
    } catch {
      setSessionState(null);
      return null;
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }
    if (initialSession !== undefined) return;
    refreshSession().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onForceLogout = () => {
      setSessionState(null);
      clearUserProfileCookie();
    }
    window.addEventListener(AUTH_FORCE_LOGOUT_EVENT, onForceLogout);
    return () => window.removeEventListener(AUTH_FORCE_LOGOUT_EVENT, onForceLogout);
  }, []);

  const setSession = (nextSession: Session | null) => {
    setSessionState(nextSession ?? null);
  };

  const clearAuth = () => {
    setSessionState(null);
    clearUserProfileCookie();
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  };

  const context = session?.context ?? null;

  const value: AuthContextValue = {
    section,
    session,
    context,
    isLoading,
    setSession,
    clearAuth,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to check if user has a specific privilege (SELLER context only)
 */
export function usePrivilege(privilege: string): boolean {
  const { session } = useAuth();
  if (!session || session.context !== "SELLER" || !session.seller) {
    return false;
  }
  return session.privileges?.includes(privilege) ?? false;
}

/**
 * Hook to check if user is owner (SELLER context only)
 */
export function useIsOwner(): boolean {
  const { session } = useAuth();
  if (!session || session.context !== "SELLER" || !session.seller) {
    return false;
  }
  return session.seller.is_owner;
}

/**
 * Onboarding grant the session runs under, when platform staff are working in
 * the store for the seller (drafts only; the seller publishes).
 */
export function useOnboardingGrantId(): string | null {
  const { session } = useAuth();
  return session?.context === "SELLER" ? (session.seller?.grantId ?? null) : null;
}

/**
 * Hook to get current seller ID (SELLER context only)
 */
export function useSellerId(): string | null {
  const { session } = useAuth();
  if (!session || session.context !== "SELLER" || !session.seller) {
    return null;
  }
  return session.seller.id;
}

