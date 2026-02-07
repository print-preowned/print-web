"use client";

/**
 * Context management following PRINT Authorization & Context Model
 * 
 * Rules:
 * - Single active context (CUSTOMER or BUSINESS)
 * - Token-based hydration
 * - No mixed UI contexts
 * - No authority inference
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AccessToken, TokenContext, decodeToken, getTokenContext } from "./token";
import { getCookie } from "../cookies";

interface AuthContextValue {
  token: string | null;
  decodedToken: AccessToken | null;
  context: TokenContext | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<AccessToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate from cookie on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const cookieToken = getCookie("authHeader");
    const storageToken = localStorage.getItem("token");

    // Prefer cookie token, fallback to localStorage
    const initialToken = cookieToken || storageToken;

    if (initialToken) {
      const decoded = decodeToken(initialToken);
      if (decoded) {
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          // Token expired, clear auth and redirect to appropriate login
          const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
          const isAdminRoute = currentPath.startsWith("/admin");
          clearAuth();
          if (typeof window !== "undefined") {
            window.location.href = isAdminRoute ? "/admin/login" : "/login";
          }
        } else {
          setTokenState(initialToken);
          setDecodedToken(decoded);
          // Sync to localStorage
          if (storageToken !== initialToken) {
            localStorage.setItem("token", initialToken);
          }
        }
      } else {
        // Invalid token, clear everything
        clearAuth();
      }
    }
    setIsLoading(false);
  }, []);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      const decoded = decodeToken(newToken);
      if (decoded) {
        setTokenState(newToken);
        setDecodedToken(decoded);
        localStorage.setItem("token", newToken);
      } else {
        console.error("Invalid token provided");
        clearAuth();
      }
    } else {
      clearAuth();
    }
  };

  const clearAuth = () => {
    setTokenState(null);
    setDecodedToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear cookie by setting it to expire
    document.cookie = "authHeader=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
  };

  const context = decodedToken?.ctx || null;

  const value: AuthContextValue = {
    token,
    decodedToken,
    context,
    isLoading,
    setToken,
    clearAuth,
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
  const { decodedToken } = useAuth();
  if (!decodedToken || decodedToken.ctx !== "BUSINESS") {
    return false;
  }
  return decodedToken.business.privileges.includes(privilege);
}

/**
 * Hook to check if user is owner (BUSINESS context only)
 */
export function useIsOwner(): boolean {
  const { decodedToken } = useAuth();
  if (!decodedToken || decodedToken.ctx !== "BUSINESS") {
    return false;
  }
  return decodedToken.business.is_owner;
}

/**
 * Hook to get current business ID (BUSINESS context only)
 */
export function useBusinessId(): string | null {
  const { decodedToken } = useAuth();
  if (!decodedToken || decodedToken.ctx !== "BUSINESS") {
    return null;
  }
  return decodedToken.business.id;
}

