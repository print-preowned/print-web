"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordResetRequestResponse, requestPasswordReset } from "@/lib/api/password";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

export function ForgotPasswordForm() {
  const { handleSubmit, register, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReset = async (data: any) => {
    setIsSubmitting(true);
    try {
      const request = requestPasswordReset({ email: data.email });
      const res = await apiFetch<PasswordResetRequestResponse>(request.endpoint, {
        method: request.method,
        body: request.body,
      });

      // TODO: In production, the token should be sent via email
      // For now, show it to the user (should be removed in production)
      if (res.token) {
        toast.success(
          `Password reset link sent! Token: ${res.token}\n\n` +
          `⚠️ In production, this token should be sent via email`
        );
      } else {
        toast.success(res.message || "If an account with that email exists, a password reset link has been sent.");
      }
    } catch (error: any) {
      console.error("Password reset request error:", error);
      // Error toast is handled by apiFetch
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleRequestReset)}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email", { 
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message as string}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>
      </div>
    </form>
  );
}
