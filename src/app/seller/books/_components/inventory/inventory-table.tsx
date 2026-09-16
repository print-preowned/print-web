"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { listingStatusLabel } from "@/lib/seller-book-listing-status";
import { EllipsisVertical, PlusCircleIcon } from "lucide-react";
import { BookTableTitleCell } from "@/components/books/book-table-title-cell";
import { sellerInventoryKeys } from "@/lib/api/query-keys";
import { formatPrice } from "@/lib/format-price";
import { useSellerId } from "@/lib/auth/context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import {
  deleteSellerInventory,
  type SellerInventoryListItem,
} from "@/app/seller/lib/api/inventory";
import { InventoryOfferForm } from "./inventory-offer-form";
import { InventoryOnboardForm } from "./inventory-onboard-form";

function formatCount(value: number) {
  return value.toLocaleString();
}

export interface InventoryTableProps {
  selectedIds: Set<string>;
  onSelectId: (ids: Set<string>) => void;
  inventory: SellerInventoryListItem[];
  isLoading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  totalPages: number;
}

export function InventoryTable({
  selectedIds,
  onSelectId: setSelectedIds,
  inventory,
  isLoading,
  pagination,
  setPagination,
  totalPages,
}: InventoryTableProps) {
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const sellerId = useSellerId();
  const queryClient = useQueryClient();

  const deleteMutation = useApiMutation<unknown>({
    onSuccess: () => {
      toast.success("Removed from inventory");
      void queryClient.invalidateQueries({ queryKey: sellerInventoryKeys.all });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to remove"),
  });

  const toggleRow = useCallback(
    (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
    },
    [selectedIds, setSelectedIds],
  );

  const openEditDrawer = useCallback(
    (offer: SellerInventoryListItem) => {
      openDrawer({
        title: "Edit offer",
        description: "Update price, stock, and condition for this listing",
        children: <InventoryOfferForm offer={offer} onSuccess={closeDrawer} />,
      });
    },
    [openDrawer, closeDrawer],
  );

  const toggleAllOnPage = useCallback(
    (rows: SellerInventoryListItem[]) => {
      const next = new Set(selectedIds);
      const pageIds = new Set(rows.map((row) => row.id));
      const allSelected = rows.length > 0 && rows.every((row) => next.has(row.id));
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      setSelectedIds(next);
    },
    [selectedIds, setSelectedIds],
  );

  const columns: ColumnDef<SellerInventoryListItem>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const rowsOnPage = table.getRowModel().rows.map((r) => r.original);
        const allSelected =
          rowsOnPage.length > 0 &&
          rowsOnPage.every((row) => selectedIds.has(row.id));
        const someSelected = rowsOnPage.some((row) => selectedIds.has(row.id));
        return (
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={() => toggleAllOnPage(rowsOnPage)}
            aria-label="Select all on page"
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleRow(row.original.id)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Book",
      cell: ({ row }) => (
        <BookTableTitleCell title={row.original.title} image={row.original.image} />
      ),
    },
    {
      accessorKey: "condition",
      header: "Condition",
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.condition ?? "—"}
          {row.original.signed ? " · Signed" : ""}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">{formatPrice(row.original.price)}</span>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">{formatCount(row.original.stock)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          label={listingStatusLabel(row.original.status)}
        />
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
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => openEditDrawer(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (confirm("Remove this offer from your inventory?")) {
                  deleteMutation.mutate(deleteSellerInventory(row.original.id));
                }
              }}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!sellerId) {
    return (
      <p className="text-muted-foreground text-sm">
        Switch to a seller context to manage your inventory.
      </p>
    );
  }

  return (
    <>
      <DataTable
        data={inventory}
        columns={columns}
        totalPages={totalPages}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        isLoading={isLoading}
      >
        <div className="flex mb-4">
          <Button
            onClick={() =>
              openDrawer({
                title: "Add to inventory",
                description: "Search by ISBN first. If it is not in the catalog, create a provisional work.",
                children: (
                  <InventoryOnboardForm onSuccess={closeDrawer} />
                ),
              })
            }
          >
            <PlusCircleIcon className="size-4 mr-2" />
            Add to inventory
          </Button>
        </div>
      </DataTable>
      {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </>
  );
}
