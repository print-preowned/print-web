"use client"

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "./form";
import { validatePasswordResetToken } from "@/lib/api/password";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("No reset token provided");
      setIsValidating(false);
      return;
    }

    setToken(tokenParam);

    // Validate token on mount
    validatePasswordResetToken(tokenParam)
      .then((response) => {
        if (response.valid) {
          setIsValid(true);
        } else {
          setError(response.message || "Invalid or expired reset token");
        }
        setIsValidating(false);
      })
      .catch((err) => {
        setError("Failed to validate reset token");
        setIsValidating(false);
        console.error("Validation error:", err);
      });
  }, [searchParams]);

  if (isValidating) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Validating Token</CardTitle>
          <CardDescription>Please wait...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isValid || !token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid Reset Token</CardTitle>
          <CardDescription>{error || "This reset token is invalid or has expired"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
