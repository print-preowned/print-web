"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Login, LoginResponse, login, platformLogin, switchContext } from "@/lib/api/auth";
import { useMutation } from "@tanstack/react-query";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";
import { setCookie } from "@/lib/cookies";
import { useAuth } from "@/lib/auth/context";
import { readBusinessByUserId } from "@/lib/api/business";
import { apiFetch } from "@/lib/api";

export function LoginForm({ isPlatform = false }: { isPlatform?: boolean }) {
  const router = useRouter();
  const { setToken, token, decodedToken } = useAuth();
  const mutation = useMutation<LoginResponse, Error, any>({})
  const { handleSubmit, register } = useForm();
  const api = isPlatform ? platformLogin : login;

  // Redirect if already authenticated
  useEffect(() => {
    if (token) {
      switch (decodedToken?.ctx) {
        case "BUSINESS": {
          router.push("/seller/dashboard");
          break;
        }
        case "PLATFORM": {
          router.push("/admin/books");
          break;
        }
        default: {
          router.push("/");
        }
      }
    }
  }, [token, decodedToken, router]);

  const handleLogin = async (data: FieldValues) => {
    try {
      const response = await mutation.mutateAsync(
        api(data as Login)
      );
      
      // Store user data and token
      if (response.data && response.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
        
        // Set token in auth context (this will also update localStorage and validate)
        setToken(response.token);
        
        // Set auth header cookie for API requests
        setCookie("authHeader", response.token, 7);

        if (isPlatform) {
          return;
        }
        
        // Check if user has a business and auto-switch to BUSINESS context
        try {
          const businessUrl = readBusinessByUserId();
          const businessResponse = await apiFetch<{ status_code: number; data: { id: string; name: string } | null }>(
            businessUrl
          );
          
          if (businessResponse.data) {
            // User has a business, switch to BUSINESS context
            const { endpoint, method, body } = switchContext("BUSINESS");
            const switchResponse = await apiFetch<{ status_code: number; message: string; token: string }>(
              endpoint,
              { method: method as "POST", body }
            );
            
            if (switchResponse.token) {
              // Update token in auth context
              setToken(switchResponse.token);
              
              // Update cookie
              setCookie("authHeader", switchResponse.token, 7);
              
              toast.success("Login successful! Switched to Business context.");
              router.push("/seller/dashboard");
              return;
            }
          }
        } catch (businessError) {
          // If business check fails, continue with CUSTOMER context
          console.log("Error checking business:", businessError);
        }
        
        // Show success message
        toast.success("Login successful!");
      }
    } catch (error) {
      // Error toast is already handled by the API client
      console.error("Login failed:", error);
    }
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
