"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completePasswordReset } from "@/lib/api/password";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const { handleSubmit, register, watch, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const password = watch("password");

  const handleReset = async (data: any) => {
    if (data.password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const request = completePasswordReset({
        token: token,
        new_password: data.password,
      });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });

      toast.success("Password reset successfully! Please login.");
      // Check if we're in admin context by checking the current path
      const isAdmin = window.location.pathname.startsWith("/admin");
      router.push(isAdmin ? "/admin/login" : "/login");
    } catch (error: any) {
      console.error("Password reset error:", error);
      // Error toast is handled by apiFetch
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleReset)}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your new password"
            {...register("password", { 
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters"
              }
            })}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message as string}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirm_password">Confirm Password</Label>
          <Input
            id="confirm_password"
            type="password"
            placeholder="Confirm your new password"
            {...register("confirm_password", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />
          {errors.confirm_password && (
            <p className="text-sm text-red-500">{errors.confirm_password.message as string}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Resetting Password..." : "Reset Password"}
        </Button>
      </div>
    </form>
  );
}
