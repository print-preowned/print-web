"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { readSellers, type Seller } from "@/lib/api/seller";
import { apiFetch } from "@/lib/api";
import { Session } from "@/lib/auth/token";
import { type Login, login, platformLogin } from "@/lib/api/auth";
import type { BaseResponse } from "@/lib/model";

function platformRedirect(session: Session) {
  return session.passwordChangeRequired
    ? "/admin/change-password"
    : "/admin/books";
}

/**
 * Only paths on this site, so a crafted link can't send people elsewhere after login.
 * The browser parses it, so tricks like "//evil.com" or "/\evil.com" resolve to their
 * real host and are rejected.
 */
function safeRedirect(redirect?: string | null) {
  if (!redirect || !redirect.startsWith("/")) return null;
  // Any fixed base works (this also runs on the server, where there's no window):
  // if the parsed URL still has the base's origin, `redirect` was a path on this site.
  const base = "http://same-site.invalid";
  try {
    const url = new URL(redirect, base);
    if (url.origin !== base) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function LoginForm({
  isPlatform = false,
  reason = null,
  redirect = null,
}: {
  isPlatform?: boolean;
  reason?: string | null;
  redirect?: string | null;
}) {
  const router = useRouter();
  const returnTo = safeRedirect(redirect);
  const sessionExpired = reason === "session_expired";
  const { session, isLoading, refreshSession } = useAuth();
  const { handleSubmit, register } = useForm();

  useEffect(() => {
    if (isLoading || !session || sessionExpired) return;
    if (returnTo) {
      router.push(returnTo);
      return;
    }

    switch (session.context) {
      case "SELLER": {
        router.push("/seller/dashboard");
        break;
      }
      case "PLATFORM": {
        router.push(platformRedirect(session));
        break;
      }
      default: {
        router.push("/");
      }
    }
  }, [session, isLoading, sessionExpired, router, returnTo]);

  const handleLogin = async (data: FieldValues) => {
    try {
      // Next /api/auth/* handlers mint the HttpOnly cookie. `/auth/login` via
      // the proxy would reach the server and drop Set-Cookie.
      const payload: Login = { email: data.email, password: data.password };
      const { endpoint, method, body } = isPlatform ? platformLogin(payload) : login(payload);
      await apiFetch<{ data?: unknown }>(`/api/${endpoint}`, {
        method,
        body,
      });
    } catch (error) {
      // Error toast is handled by apiFetch
      return;
    }

    const nextSession = await refreshSession();

    if (returnTo) {
      toast.success("Login successful!");
      router.push(returnTo);
      return;
    }

    if (isPlatform) {
      toast.success("Login successful!");
      if (nextSession?.context === "PLATFORM") {
        router.push(platformRedirect(nextSession));
      } else {
        router.push("/admin/books");
      }
      return;
    }

    try {
      const memberships = await apiFetch<BaseResponse<Seller[]>>(readSellers());
      const sellers = memberships.data ?? [];
      if (sellers.length === 1) {
        const switched = await apiFetch("/api/auth/context-switch", {
          method: "POST",
          body: {
            targetContext: "SELLER",
            seller_id: sellers[0].id,
          },
          silentStatuses: [400, 401, 403, 422],
        });
        if (switched) {
          await refreshSession();
          toast.success("Login successful! Switched to Seller context.");
          router.push("/seller/dashboard");
          return;
        }
      }
    } catch {
      // continue with CUSTOMER context
    }

    toast.success("Login successful!");
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit(handleLogin)}>
      <div className="grid gap-6">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              {...register("email")}
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <a
                href={`${isPlatform ? "/admin/forgot-password" : "/forgot-password"}`}
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <Input
              {...register("password")}
              name="password"
              type="password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </div>
      </div>
    </form>
  );
}
