"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptPlatformInvite } from "@/lib/api/platform";
import { useMutation } from "@tanstack/react-query";
import { FieldValues, useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AcceptInviteFormProps {
  token: string;
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter();
  const { handleSubmit, register, watch, formState: { errors } } = useForm();
  const { mutateAsync } = useMutation<any, any, any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const password = watch("password");

  const handleAccept = async (data: FieldValues) => {
    if (data.password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        token: token,
        password: data.password as string,
        first_name: data.first_name as string,
        last_name: data.last_name as string,
        middle_name: data.middle_name as string | undefined,
      };

      const request = acceptPlatformInvite(payload);
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });

      toast.success("Account created successfully! Please login.");
      router.push("/admin/login");
    } catch (error: any) {
      console.error("Accept invite error:", error);
      // Error toast is handled by apiFetch
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleAccept)}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            type="text"
            placeholder="John"
            {...register("first_name", { required: "First name is required" })}
          />
          {errors.first_name && (
            <p className="text-sm text-red-500">{errors.first_name.message as string}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            type="text"
            placeholder="Doe"
            {...register("last_name", { required: "Last name is required" })}
          />
          {errors.last_name && (
            <p className="text-sm text-red-500">{errors.last_name.message as string}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="middle_name">Middle Name (Optional)</Label>
          <Input
            id="middle_name"
            type="text"
            placeholder="Michael"
            {...register("middle_name")}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
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
            placeholder="Confirm your password"
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
          {isSubmitting ? "Creating Account..." : "Accept Invitation"}
        </Button>
      </div>
    </form>
  );
}
