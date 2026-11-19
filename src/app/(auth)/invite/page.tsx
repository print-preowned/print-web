"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, apiErrorToast } from "@/lib/api";
import {
  acceptInvite,
  declineInvite,
  lookupInvite,
  registerFromInvite,
  type SellerInviteLookup,
} from "@/lib/api/seller-team";
import { useAuth } from "@/lib/auth/context";
import { readUserProfileCookie } from "@/lib/auth/profile-cookie";
import type { BaseResponse } from "@/lib/model";

/**
 * Where an emailed store invitation lands. Signed-in people accept with the account
 * the invite was sent to; people without an account create one here and join at once.
 */
function InviteContent() {
  const token = useSearchParams().get("token") ?? "";
  const { session, isLoading } = useAuth();
  const [declined, setDeclined] = useState(false);

  const lookup = useQuery({
    queryKey: ["seller-invite", token],
    enabled: Boolean(token),
    retry: false,
    queryFn: async () => {
      const request = lookupInvite(token);
      const result = await apiFetch<BaseResponse<SellerInviteLookup> | null>(request.endpoint, {
        method: request.method,
        body: request.body,
        silentStatuses: [404, 422],
      });
      return result?.data ?? null;
    },
  });

  if (!token || (lookup.isFetched && !lookup.data)) {
    return (
      <Message title="This invitation can't be used">
        The link is invalid, has expired, or was already used. Ask the store to send you a new
        one.
      </Message>
    );
  }
  if (declined) {
    return <Message title="Invitation declined">You won&apos;t be added to the store.</Message>;
  }
  if (lookup.isLoading || isLoading || !lookup.data) {
    return <Message title="Checking your invitation…" />;
  }

  const invite = lookup.data;
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Join {invite.seller_name}</CardTitle>
        <CardDescription>
          {invite.invited_by_name} invited <strong>{invite.email}</strong> to join as{" "}
          {invite.role_name}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {session ? (
          <SignedIn invite={invite} token={token} />
        ) : invite.has_account ? (
          <Button asChild className="w-full">
            <Link href={`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}>
              Sign in as {invite.email} to accept
            </Link>
          </Button>
        ) : (
          <Register invite={invite} token={token} />
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <Decline token={token} onDeclined={() => setDeclined(true)} />
      </CardFooter>
    </Card>
  );
}

/** Joining switches straight into the store, so the person lands where they'll work. */
function useEnterStore() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  return async (invite: SellerInviteLookup) => {
    await apiFetch("/api/auth/context-switch", {
      method: "POST",
      body: { targetContext: "SELLER", seller_id: invite.seller_id },
    });
    await refreshSession();
    toast.success(`Welcome to ${invite.seller_name}`);
    router.push("/seller/dashboard");
  };
}

function SignedIn({ invite, token }: { invite: SellerInviteLookup; token: string }) {
  const { refreshSession } = useAuth();
  const enterStore = useEnterStore();
  const signedInAs = readUserProfileCookie()?.email;
  const wrongAccount =
    signedInAs !== undefined && signedInAs.toLowerCase() !== invite.email.toLowerCase();

  const accept = useMutation({
    mutationFn: async () => {
      const request = acceptInvite(token);
      return apiFetch(request.endpoint, { method: request.method, body: request.body });
    },
    onSuccess: () => enterStore(invite),
    onError: (error) => apiErrorToast(error, "Could not accept the invitation"),
  });

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refreshSession();
  };

  if (wrongAccount) {
    return (
      <div className="space-y-3 text-center text-sm">
        <p>
          You&apos;re signed in as {signedInAs}. Sign out, then sign in as {invite.email} or
          create that account to accept.
        </p>
        <Button variant="outline" className="w-full" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }
  return (
    <Button className="w-full" disabled={accept.isPending} onClick={() => accept.mutate()}>
      {accept.isPending ? "Joining…" : `Join ${invite.seller_name}`}
    </Button>
  );
}

function Register({ invite, token }: { invite: SellerInviteLookup; token: string }) {
  const { refreshSession } = useAuth();
  const enterStore = useEnterStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  const register = useMutation({
    mutationFn: async () => {
      const request = registerFromInvite({
        token,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
      });
      await apiFetch(request.endpoint, { method: request.method, body: request.body });
      // The account exists and is on the team; sign in to get a session cookie.
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email: invite.email, password },
      });
      await refreshSession();
    },
    onSuccess: () => enterStore(invite),
    onError: (error) => apiErrorToast(error, "Could not create your account"),
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        register.mutate();
      }}
    >
      <p className="text-muted-foreground text-sm">
        Create your account for {invite.email} to join.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="first_name">First name</Label>
        <Input
          id="first_name"
          required
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="last_name">Last name</Label>
        <Input
          id="last_name"
          required
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">At least 8 characters.</p>
      </div>
      <Button type="submit" className="w-full" disabled={register.isPending}>
        {register.isPending ? "Creating account…" : "Create account and join"}
      </Button>
    </form>
  );
}

function Decline({ token, onDeclined }: { token: string; onDeclined: () => void }) {
  const decline = useMutation({
    mutationFn: async () => {
      const request = declineInvite(token);
      return apiFetch(request.endpoint, { method: request.method, body: request.body });
    },
    onSuccess: onDeclined,
    onError: (error) => apiErrorToast(error, "Could not decline the invitation"),
  });
  return (
    <button
      type="button"
      className="text-muted-foreground text-sm underline underline-offset-4"
      disabled={decline.isPending}
      onClick={() => decline.mutate()}
    >
      Decline invitation
    </button>
  );
}

function Message({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        {children ? <CardDescription>{children}</CardDescription> : null}
      </CardHeader>
    </Card>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteContent />
    </Suspense>
  );
}
