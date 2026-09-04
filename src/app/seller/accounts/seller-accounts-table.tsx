"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/status-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisVertical, PlusCircleIcon } from "lucide-react";
import { SellerForm } from "./seller-form";
import { Seller, readSellers, deleteSeller } from "@/lib/api/seller";
import { apiFetch } from "@/lib/api";
import { useAuth, useSellerId } from "@/lib/auth/context";
import { useSwitchContext } from "@/components/context-switcher";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SellerAccountsTable() {
  const router = useRouter();
  const { session, refreshSession } = useAuth();
  const currentSellerId = useSellerId();
  const { handleSwitchContext, isSwitching } = useSwitchContext({ targetContext: "SELLER" });
  const [page, setPage] = useState(1);
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();

  const query = useQuery({
    queryKey: ["sellers", page],
    queryFn: () =>
      apiFetch<{ data?: Seller[]; pagination?: { total_pages?: number } }>(
        readSellers(),
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint } = deleteSeller(id);
      return apiFetch(endpoint, { method: "DELETE" });
    },
    onSuccess: async (_data, id) => {
      await refreshSession();
      toast.success("Storefront deleted");
      if (id === currentSellerId) {
        router.push("/");
        return;
      }
      query.refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete storefront");
    },
  });

  const data = query.data?.data || [];
  const totalPages = query.data?.pagination?.total_pages ?? 1;

  const handleFormSuccess = () => {
    closeDrawer();
    void query.refetch();
  };

  const columns: ColumnDef<Seller>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("name")}
          {row.original.id === currentSellerId ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">Current</span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null | undefined;
        return (
          <div className="max-w-[300px] truncate text-sm text-muted-foreground">
            {description || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.getValue("status") as string} />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isRowOwner = session?.id === row.original.user_id;
        const isCurrent = row.original.id === currentSellerId;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8 justify-self-end" size="icon">
                <EllipsisVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {!isCurrent && (
                <DropdownMenuItem
                  disabled={isSwitching}
                  onClick={() => void handleSwitchContext(row.original.id)}
                >
                  Switch
                </DropdownMenuItem>
              )}
              {isRowOwner && (
                <DropdownMenuItem
                  onClick={() =>
                    openDrawer({
                      title: "Edit storefront",
                      description: "Update storefront details",
                      children: (
                        <SellerForm
                          seller={row.original}
                          onCancel={closeDrawer}
                          onSuccess={handleFormSuccess}
                        />
                      ),
                    })
                  }
                >
                  Edit
                </DropdownMenuItem>
              )}
              {isRowOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this storefront?")) {
                        deleteMutation.mutate(row.original.id);
                      }
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
    },
  ];

  return (
    <div>
      <DataTable
        data={data}
        columns={columns}
        isLoading={query.isLoading}
        totalPages={totalPages}
        pageIndex={page - 1}
        pageSize={10}
        onPaginationChange={(updater) => {
          const next =
            typeof updater === "function"
              ? updater({ pageIndex: page - 1, pageSize: 10 })
              : updater;
          setPage(next.pageIndex + 1);
        }}
      >
        <div className="flex mb-4">
          <Button
            onClick={() =>
              openDrawer({
                title: "New account",
                description: "Create another seller account on your legal profile",
                children: (
                  <SellerForm
                    onCancel={closeDrawer}
                    onSuccess={handleFormSuccess}
                  />
                ),
              })
            }
          >
            <PlusCircleIcon className="size-4" />
            Add account
          </Button>
        </div>
      </DataTable>
      {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </div>
  );
}
