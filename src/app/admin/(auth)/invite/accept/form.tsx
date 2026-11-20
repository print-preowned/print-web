"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptPlatformInvite } from "@/app/admin/lib/api/platform";
import { FieldValues, useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface AcceptInviteFormProps {
  token: string;
  email: string | null;
}

export function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const router = useRouter();
  const { handleSubmit, register, watch, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const password = watch("password");

  const handleAccept = async (data: FieldValues) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        token: token,
        password: data.password as string,
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        middleName: data.middleName as string | undefined,
      };

      const request = acceptPlatformInvite(payload);
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });

      toast.success("Account created successfully! Please login.");
      router.push("/login");
    } catch (error: unknown) {
      console.error("Accept invite error:", error);
      // Error toast is handled by apiFetch
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleAccept)}>
      <div className="grid gap-6">
        {email && (
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              aria-readonly="true"
              className="bg-muted"
            />
          </div>
        )}
        <div className="grid gap-3">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            {...register("firstName", { required: "First name is required" })}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message as string}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            {...register("lastName", { required: "Last name is required" })}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message as string}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="middleName">Middle Name (Optional)</Label>
          <Input
            id="middleName"
            type="text"
            placeholder="Michael"
            {...register("middleName")}
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
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message as string}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Accept Invitation"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Not interested?{" "}
          <Link
            href={`/invite/reject?token=${encodeURIComponent(token)}`}
            className="underline underline-offset-4 hover:text-primary"
          >
            Decline invitation
          </Link>
        </p>
      </div>
    </form>
  );
}
