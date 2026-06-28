"use client"

import { Suspense, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RejectInviteForm } from "./form";
import { validatePlatformInvite } from "@/lib/api/platform";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function RejectInviteContent() {
  const searchParams = useSearchParams();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);

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

  if (rejected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invitation Declined</CardTitle>
          <CardDescription aria-live="polite">
            You have declined this platform invitation. No account was created.
          </CardDescription>
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
        <CardTitle className="text-xl">Decline Invitation</CardTitle>
        <CardDescription>
          Are you sure you want to decline this platform invitation?
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <RejectInviteForm token={token} onRejected={() => setRejected(true)} />
        <p className="text-center text-sm text-muted-foreground">
          Changed your mind?{" "}
          <Link
            href={`/admin/invite/accept?token=${encodeURIComponent(token)}`}
            className="underline underline-offset-4 hover:text-primary"
          >
            Accept invitation instead
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RejectInvitePage() {
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
      <RejectInviteContent />
    </Suspense>
  );
}
