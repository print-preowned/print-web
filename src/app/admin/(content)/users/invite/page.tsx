"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteForm } from "./form";

export default function InviteUserPage() {
  return (
    <>
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invite Platform User</CardTitle>
          <CardDescription>
            Create an invite for a new platform user. They will receive an email with instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>
    </>
  );
}
