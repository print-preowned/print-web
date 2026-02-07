"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/api/password";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChangePasswordForm() {
  const router = useRouter();
  const { handleSubmit, register, watch, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const newPassword = watch("new_password");

  const handleChange = async (data: any) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const request = changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });

      toast.success("Password changed successfully!");
      // Check if we're in admin context by checking the current path
      const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
      router.push(isAdmin ? "/admin/dashboard" : "/account");
    } catch (error: any) {
      console.error("Password change error:", error);
      // Error toast is handled by apiFetch
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
          {isSubmitting ? "Changing Password..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
