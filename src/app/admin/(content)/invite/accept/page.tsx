"use client"

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteForm } from "./form";
import { validatePlatformInvite } from "@/lib/api/platform";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("No invite token provided");
      setIsValidating(false);
      return;
    }

    setToken(tokenParam);

    // Validate token on mount
    validatePlatformInvite(tokenParam)
      .then((response) => {
        if (response.valid) {
          setIsValid(true);
        } else {
          setError(response.message || "Invalid or expired invite");
        }
        setIsValidating(false);
      })
      .catch((err) => {
        setError("Failed to validate invite");
        setIsValidating(false);
        console.error("Validation error:", err);
      });
  }, [searchParams]);

  if (isValidating) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Validating Invite</CardTitle>
          <CardDescription>Please wait...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isValid || !token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid Invite</CardTitle>
          <CardDescription>{error || "This invite is invalid or has expired"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Accept Invitation</CardTitle>
        <CardDescription>
          Complete your registration to join the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInviteForm token={token} />
      </CardContent>
    </Card>
  );
}
