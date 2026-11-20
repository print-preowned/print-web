"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { apiErrorToast, apiFetch } from "@/lib/api";
import type { Session } from "@/lib/auth/token";
import { HOME_PATH, type Section } from "@/lib/sections";

type StoreOption = { id: string; name: string; logo?: string | null };

/**
 * Only paths on this host, which is this section, so a crafted link can't send
 * people elsewhere after login. The browser parses it, so tricks like
 * "//evil.com" or "/\evil.com" resolve to their real host and are rejected.
 */
function safeRedirect(redirect: string | null | undefined) {
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

function destination(section: Section, session: Session | null, returnTo: string | null) {
  if (section === "admin" && session?.passwordChangeRequired) return "/change-password";
  return returnTo ?? HOME_PATH[section];
}

/**
 * Sign-in for one section. Each section signs in on its own and gets its own
 * session; signing in here never touches the others.
 */
export function LoginForm({
  section,
  reason = null,
  redirect = null,
  inviteToken = null,
  forgotPasswordHref,
}: {
  section: Section;
  reason?: string | null;
  redirect?: string | null;
  /** Seller sign-in from an invite link: joins that store, then opens it. */
  inviteToken?: string | null;
  forgotPasswordHref: string;
}) {
  const returnTo = safeRedirect(redirect);
  const sessionExpired = reason === "session_expired";
  const { session, isLoading, refreshSession } = useAuth();
  const { handleSubmit, register } = useForm();
  const [stores, setStores] = useState<StoreOption[] | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !session || sessionExpired || inviteToken) return;
    window.location.assign(destination(section, session, returnTo));
  }, [session, isLoading, sessionExpired, inviteToken, section, returnTo]);

  const handleLogin = async (data: FieldValues) => {
    let result: { stores?: StoreOption[] } | null;
    try {
      // Next /api/auth/* handlers mint the HttpOnly cookie. Calling the API
      // through the proxy would drop Set-Cookie.
      result = await apiFetch<{ stores?: StoreOption[] }>("/api/auth/login", {
        method: "POST",
        body: {
          email: data.email,
          password: data.password,
          ...(inviteToken ? { inviteToken } : {}),
        },
      });
    } catch {
      // Error toast is handled by apiFetch
      return;
    }

    if (result?.stores?.length) {
      setStores(result.stores);
      return;
    }

    const nextSession = await refreshSession();
    toast.success("Login successful!");
    window.location.assign(destination(section, nextSession, returnTo));
  };

  const openStore = async (store: StoreOption) => {
    setOpening(store.id);
    try {
      await apiFetch("/api/auth/select-store", { method: "POST", body: { sellerId: store.id } });
      window.location.assign(returnTo ?? HOME_PATH.seller);
    } catch (error) {
      apiErrorToast(error, "Couldn't open the store");
      setOpening(null);
      setStores(null);
    }
  };

  if (stores) {
    return (
      <div className="grid gap-3">
        <p className="text-muted-foreground text-sm">Which store do you want to work in?</p>
        {stores.map((store) => (
          <Button
            key={store.id}
            variant="outline"
            className="justify-start"
            disabled={opening !== null}
            onClick={() => void openStore(store)}
          >
            {store.name}
          </Button>
        ))}
      </div>
    );
  }

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
                href={forgotPasswordHref}
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
