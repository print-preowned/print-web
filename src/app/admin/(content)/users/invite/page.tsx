"use client";

import { InviteForm } from "./form";

export default function InviteUserPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Invite platform user</h1>
        <p className="text-muted-foreground text-sm">
          Send an invitation with access to a selected platform privilege set.
        </p>
      </div>
      <InviteForm />
    </div>
  );
}
