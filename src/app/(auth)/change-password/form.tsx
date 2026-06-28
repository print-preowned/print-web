"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";

interface ChangePasswordFormProps {
  redirectTo?: string;
  isFirstLogin?: boolean;
}

export function ChangePasswordForm({
  redirectTo = "/account",
  isFirstLogin = false,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { handleSubmit, register, watch, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const newPassword = watch("new_password");

  const handleChange = async (data: Record<string, string>) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.detail ?? "Password change failed");
        return;
      }

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as { status?: string };
          user.status = "ACTIVE";
          localStorage.setItem("user", JSON.stringify(user));
        } catch {
          // ignore parse errors
        }
      }

      await refreshSession();

      toast.success(
        isFirstLogin
          ? "Password set successfully!"
          : "Password changed successfully!"
      );
      router.push(redirectTo);
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Password change failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleChange)}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="current_password">Current Password</Label>
          <Input
            id="current_password"
            type="password"
            placeholder="Enter your current password"
            {...register("current_password", { required: "Current password is required" })}
          />
          {errors.current_password && (
            <p className="text-sm text-red-500">{errors.current_password.message as string}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="new_password">New Password</Label>
          <Input
            id="new_password"
            type="password"
            placeholder="Enter your new password"
            {...register("new_password", { 
              required: "New password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters"
              }
            })}
          />
          {errors.new_password && (
            <p className="text-sm text-red-500">{errors.new_password.message as string}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirm_password">Confirm New Password</Label>
          <Input
            id="confirm_password"
            type="password"
            placeholder="Confirm your new password"
            {...register("confirm_password", {
              required: "Please confirm your new password",
              validate: (value) =>
                value === newPassword || "Passwords do not match",
            })}
          />
          {errors.confirm_password && (
            <p className="text-sm text-red-500">{errors.confirm_password.message as string}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? isFirstLogin
              ? "Setting Password..."
              : "Changing Password..."
            : isFirstLogin
              ? "Set Password"
              : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
