"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AdminPrivilegeSetForm } from "../../form";
import { readPlatformPrivilegeSet } from "@/app/admin/lib/api/platform";

export default function AdminEditPrivilegeSetPage() {
  const { id } = useParams<{ id: string }>();
  const privilegeSetQuery = useQuery({
    queryKey: ["platform-privilege-set", id],
    queryFn: () => readPlatformPrivilegeSet(id),
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Edit privilege set</h1>
        <p className="text-muted-foreground text-sm">
          Update the platform role and the privileges it grants.
        </p>
      </div>
      {privilegeSetQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading privilege set…</p>
      ) : privilegeSetQuery.isError ? (
        <p className="text-destructive text-sm">
          {privilegeSetQuery.error.message || "Could not load privilege set."}
        </p>
      ) : privilegeSetQuery.data ? (
        <AdminPrivilegeSetForm
          privilegeSet={privilegeSetQuery.data.data}
        />
      ) : null}
    </div>
  );
}