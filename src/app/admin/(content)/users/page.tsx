"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlatformUser,
  PlatformInvite,
  readPlatformUsers,
  readPlatformInvites,
  deletePlatformUser,
  revokePlatformInvite,
} from "@/lib/api/platform";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import usePagination, {
  UsePaginationResult,
} from "@/lib/pagination/usePagination";
import { EllipsisVertical, UserPlus } from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { useState } from "react";
import { ResendInviteDialog } from "./resend-invite-dialog";
import { EditPlatformUserDialog } from "./edit-platform-user-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPlatformUsersPage() {
  const invitesQuery = usePagination<PlatformInvite>({
    queryKey: ["platform-invites"],
    getUrl: ({ page, size }) => readPlatformInvites({ page, size }),
    initialPageSize: 10,
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="users" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="users">Platform users</TabsTrigger>
            <TabsTrigger value="invites">Recent invites</TabsTrigger>
          </TabsList>
          <Button asChild>
            <Link href="/admin/users/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite user
            </Link>
          </Button>
        </div>

        <TabsContent value="users" className="mt-4">
          <PlatformUsersTable />
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <PendingInvitesTable invitesQuery={invitesQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlatformUsersTable() {
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState<PlatformUser | null>(null);

  const {
    data: platformUsers,
    isLoading: usersLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<PlatformUser>({
    queryKey: ["platform-users"],
    getUrl: ({ page, size }) => readPlatformUsers({ page, size }),
    initialPageSize: 10,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint } = deletePlatformUser(id);
      return apiFetch(endpoint, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success("Platform user removed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove platform user");
    },
  });

  const columns: ColumnDef<PlatformUser & { id: string }>[] = [
    {
      accessorKey: "user_name",
      header: "Name",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.user_name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "user_email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.user_email ?? row.original.user_id}
        </span>
      ),
    },
    {
      accessorKey: "platform_privilege_set_name",
      header: "Role",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.platform_privilege_set_name ??
            row.original.platform_privilege_set_id}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8 justify-self-end"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {!row.original.is_super_admin && (
              <DropdownMenuItem onClick={() => setEditUser(row.original)}>
                Edit role
              </DropdownMenuItem>
            )}
            {!row.original.is_super_admin && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant="destructive"
              disabled={row.original.is_super_admin}
              title={
                row.original.is_super_admin
                  ? "Cannot remove the super admin"
                  : undefined
              }
              onClick={() => {
                if (row.original.is_super_admin) return;
                if (
                  confirm(
                    "Remove this user's platform access? They will no longer be able to sign in to the admin.",
                  )
                ) {
                  deleteMutation.mutate(row.original.id);
                }
              }}
            >
              Remove access
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!platformUsers.length && usersLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading…</div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={platformUsers}
        totalPages={totalPages}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        isLoading={usersLoading}
      />
      <EditPlatformUserDialog
        platformUser={editUser}
        open={editUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
      />
    </>
  );
}

function PendingInvitesTable({
  invitesQuery,
}: {
  invitesQuery: UsePaginationResult<PlatformInvite>;
}) {
  const queryClient = useQueryClient();
  const [resendInvite, setResendInvite] = useState<PlatformInvite | null>(null);

  const {
    data: invites,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = invitesQuery;

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const request = revokePlatformInvite(id);
      return apiFetch(request.endpoint, { method: request.method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-invites"] });
      toast.success("Invitation revoked");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to revoke invitation");
    },
  });

  const columns: ColumnDef<PlatformInvite & { id: string }>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "platform_privilege_set_name",
      header: "Role",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.platform_privilege_set_name ??
            row.original.platform_privilege_set_id}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "expires_at",
      header: "Expires",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.original.expires_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8 justify-self-end"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Invite actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setResendInvite(row.original)}
              disabled={row.original.status !== "PENDING"}
              className={
                row.original.status !== "PENDING" ? "cursor-not-allowed" : ""
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    `Revoke the invitation for ${row.original.email}? They will no longer be able to accept it.`,
                  )
                ) {
                  revokeMutation.mutate(row.original.id);
                }
              }}
              disabled={row.original.status !== "PENDING"}
              className={
                row.original.status !== "PENDING" ? "cursor-not-allowed" : ""
              }
            >
              Revoke
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!invites.length && isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading invites…
      </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={invites}
        totalPages={totalPages}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        isLoading={isLoading}
      />
      <ResendInviteDialog
        invite={resendInvite}
        open={resendInvite !== null}
        onOpenChange={(open) => {
          if (!open) setResendInvite(null);
        }}
      />
    </>
  );
}
