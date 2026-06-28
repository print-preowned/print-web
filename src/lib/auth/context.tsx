"use client";

/**
 * Context management following PRINT Authorization & Context Model
 *
 * Rules:
 * - Single active context (CUSTOMER or BUSINESS)
 * - Token-based hydration (token stored HttpOnly cookie, never exposed to client)
 * - No mixed UI contexts
 * - No authority inference
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, TokenContext } from "./token";

interface AuthContextValue {
  session: Session | null;
  context: TokenContext | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  clearAuth: () => void;
  refreshSession: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async (): Promise<Session | null> => {
    if (typeof window === "undefined") return null;
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
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
    refreshSession().finally(() => setIsLoading(false));
  }, []);

  const setSession = (nextSession: Session | null) => {
    setSessionState(nextSession ?? null);
  };

  const clearAuth = () => {
    setSessionState(null);
    localStorage.removeItem("user");
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  };

  const context = session?.context ?? null;

  const value: AuthContextValue = {
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
 * Hook to check if user has a specific privilege (BUSINESS context only)
 */
export function usePrivilege(privilege: string): boolean {
  const { session } = useAuth();
  if (!session || session.context !== "BUSINESS" || !session.business) {
    return false;
  }
  return session.business.privileges.includes(privilege);
}

/**
 * Hook to check if user is owner (BUSINESS context only)
 */
export function useIsOwner(): boolean {
  const { session } = useAuth();
  if (!session || session.context !== "BUSINESS" || !session.business) {
    return false;
  }
  return session.business.is_owner;
}

/**
 * Hook to get current business ID (BUSINESS context only)
 */
export function useBusinessId(): string | null {
  const { session } = useAuth();
  if (!session || session.context !== "BUSINESS" || !session.business) {
    return null;
  }
  return session.business.id;
}

