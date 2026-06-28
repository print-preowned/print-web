"use client"

import { Suspense, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteForm } from "./form";
import { validatePlatformInvite } from "@/lib/api/platform";
import { useSearchParams } from "next/navigation";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("No invite token provided");
      setIsValidating(false);
      return;
    }

    setToken(tokenParam);

    validatePlatformInvite(tokenParam)
      .then((response) => {
        if (response.valid) {
          setIsValid(true);
          setInviteEmail(response.invite?.email ?? null);
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
          <CardDescription aria-live="polite">
            {error || "This invite is invalid or has expired"}
          </CardDescription>
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
        <AcceptInviteForm token={token} email={inviteEmail} />
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Validating Invite</CardTitle>
            <CardDescription>Please wait...</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
