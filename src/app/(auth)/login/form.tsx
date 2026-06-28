"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { readBusinessByUserId } from "@/lib/api/business";
import { apiFetch } from "@/lib/api";
import { Session } from "@/lib/auth/token";

function platformRedirect(session: Session) {
  return session.passwordChangeRequired ? "/admin/change-password" : "/admin/books";
}

export function LoginForm({ isPlatform = false }: { isPlatform?: boolean }) {
  const router = useRouter();
  const { session, refreshSession } = useAuth();
  const { handleSubmit, register } = useForm();

  useEffect(() => {
    if (session) {
      switch (session?.context) {
        case "BUSINESS": {
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
    }
  }, [session, router]);

  const handleLogin = async (data: FieldValues) => {
    try {
      const authPath = isPlatform ? "/api/auth/platform-login" : "/api/auth/login";
      const res = await fetch(authPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
        credentials: "include",
      });
      const response = await res.json();

      if (!res.ok) {
        toast.error(response.detail ?? "Login failed");
        return;
      }

      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      const nextSession = await refreshSession();

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
        const businessResponse = await apiFetch<{ data: { id: string; name: string } | null }>(
          "/business/read/by-user-id"
        );
        if (businessResponse.data) {
          const switchRes = await fetch("/api/auth/context-switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target_context: "BUSINESS" }),
            credentials: "include",
          });
          if (switchRes.ok) {
            await refreshSession();
            toast.success("Login successful! Switched to Business context.");
            router.push("/seller/dashboard");
            return;
          }
        }
      } catch {
        // continue with CUSTOMER context
      }

      toast.success("Login successful!");
      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed");
    }
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
            <Input {...register("password")} name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </div>
      </div>
    </form>
  );
}
