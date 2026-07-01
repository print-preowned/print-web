"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { AdminPrivilegeSetForm } from "@/app/admin/(content)/privilege-sets/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deletePlatformPrivilegeSet,
  PlatformPrivilegeSet,
  readPlatformPrivilegeSetsUrl,
} from "@/lib/api/platform";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Plus, EllipsisVertical } from "lucide-react";
import usePagination from "@/lib/pagination/usePagination";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";

export default function AdminPrivilegeSetsPage() {
  const queryClient = useQueryClient();
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();

  const {
    data: privilegeSets,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<PlatformPrivilegeSet>({
    queryKey: ["platform-privilege-sets"],
    getUrl: ({ page, size }) => readPlatformPrivilegeSetsUrl({ page, size }),
    initialPageSize: 10,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint } = deletePlatformPrivilegeSet(id);
      return apiFetch(endpoint, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-privilege-sets"] });
      toast.success("Privilege set deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete privilege set");
    },
  });

  const columns: ColumnDef<PlatformPrivilegeSet & { id: string }>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
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
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={() =>
                openDrawer({
                  title: "Edit privilege set",
                  description: "Update name, status, and assigned privileges",
                  children: (
                    <AdminPrivilegeSetForm
                      privilegeSet={row.original}
                      onSuccess={closeDrawer}
                    />
                  ),
                })
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    `Delete the "${row.original.name}" privilege set? Users assigned this set will lose platform access until reassigned.`,
                  )
                ) {
                  deleteMutation.mutate(row.original.id);
                }
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Privilege sets
          </h1>
          <p className="text-muted-foreground text-sm">
            Create and manage platform roles assigned to admin users and
            invites. Super Admin is managed separately via account transfer.
          </p>
        </div>
        <Button
          onClick={() =>
            openDrawer({
              title: "Create privilege set",
              description: "Define a new role and its platform privileges",
              children: <AdminPrivilegeSetForm onSuccess={closeDrawer} />,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Create privilege set
        </Button>
      </div>

      {!privilegeSets.length && isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          data={privilegeSets}
          totalPages={totalPages}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      )}

      {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </div>
  );
}
