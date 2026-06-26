"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useQueryClient } from "@tanstack/react-query";
import {
  PlatformUser,
  PlatformInvite,
  readPlatformUsers,
  readPlatformInvites,
  deletePlatformUser,
} from "@/lib/api/platform";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import usePagination from "@/lib/pagination/usePagination";
import { EllipsisVertical, Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminPlatformUsersPage() {
  const queryClient = useQueryClient();

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
      accessorKey: "user_email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.user_email ?? row.original.user_id}
        </span>
      ),
    },
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
      accessorKey: "platform_privilege_set_id",
      header: "Privilege set",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs font-mono">
          {row.original.platform_privilege_set_id}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs ${
            row.original.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.original.status}
        </Badge>
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
      cell: ({ row, table }) => (
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
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    "Remove this user's platform access? They will no longer be able to sign in to the admin."
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

  return (
    <div className="container mx-auto py-4 px-4 space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <Button asChild>
            <Link href="/admin/users/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite user
            </Link>
          </Button>
        </div>

        {!platformUsers.length && usersLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading…
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={platformUsers}
            totalPages={totalPages}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPaginationChange={setPagination}
            isLoading={usersLoading}
          />
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Recent invites</CardTitle>
            <CardDescription>
              Platform invites and their status. Create new invites from the button
              above.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users/invite">
              <Plus className="mr-2 h-4 w-4" />
              New invite
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <PendingInvitesTable />
        </CardContent>
      </Card>
    </div>
  );
}

function PendingInvitesTable() {
  const {
    data: invites,
    isLoading,
  } = usePagination<PlatformInvite>({
    queryKey: ["platform-invites"],
    getUrl: ({ page, size }) => readPlatformInvites({ page, size }),
    initialPageSize: 5,
  });

  if (isLoading) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Loading invites…
      </div>
    );
  }
  if (!invites.length) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        No invites yet. Invite a user to get started.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Privilege set</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.email}</TableCell>
            <TableCell className="text-muted-foreground text-xs font-mono">
              {inv.platform_privilege_set_id}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(inv.expires_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(inv.created_at).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
