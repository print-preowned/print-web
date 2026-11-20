"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import {
  deleteSellerInventory,
  describeMissing,
  inventoryTitle,
  inventoryImage,
  readSellerInventoryStatusCounts,
  type SellerInventory,
  type SellerListingStatusFilter,
} from "@/app/seller/lib/api/inventory";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useOnboardingGrantId, usePrivilege } from "@/lib/auth/context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InventoryEditOfferForm } from "./inventory-edit-offer-form";
import { ScannerBar } from "./scanner-bar";

function formatCount(value: number) {
  return value.toLocaleString();
}

export interface InventoryTableProps {
  selectedIds: Set<string>;
  onSelectId: (ids: Set<string>) => void;
  inventory: SellerInventory[];
  isLoading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  totalPages: number;
  status: SellerListingStatusFilter | undefined;
  onStatusChange: (status: SellerListingStatusFilter | undefined) => void;
}

const STATUS_FILTERS: {
  value: SellerListingStatusFilter | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ACTIVE", label: "Live" },
  { value: "INACTIVE", label: "Paused" },
];

export function InventoryTable({
  selectedIds,
  onSelectId: setSelectedIds,
  inventory,
  isLoading,
  pagination,
  setPagination,
  totalPages,
  status,
  onStatusChange,
}: InventoryTableProps) {
  const statusCounts = useApiQuery<Record<string, number>>(
    [...sellerInventoryKeys.all, "status-counts"],
    readSellerInventoryStatusCounts(),
  );
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  // Staff onboarding a store edit drafts only and can't remove offers.
  const onboarding = useOnboardingGrantId() != null;
  const canRemove = usePrivilege("DELETE_SELLER_INVENTORY");
  const router = useRouter();
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
    (offer: SellerInventory) => {
      openDrawer({
        title: "Edit offer",
        description: "Update price, stock, and condition for this listing",
        children: (
          <InventoryEditOfferForm offer={offer} onSuccess={closeDrawer} />
        ),
      });
    },
    [openDrawer, closeDrawer],
  );

  const toggleAllOnPage = useCallback(
    (rows: SellerInventory[]) => {
      const next = new Set(selectedIds);
      const pageIds = new Set(rows.map((row) => row.id));
      const allSelected =
        rows.length > 0 && rows.every((row) => next.has(row.id));
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      setSelectedIds(next);
    },
    [selectedIds, setSelectedIds],
  );

  const columns: ColumnDef<SellerInventory>[] = [
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
            checked={
              allSelected ? true : someSelected ? "indeterminate" : false
            }
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
        <BookTableTitleCell
          title={inventoryTitle(row.original)}
          image={inventoryImage(row.original)}
        />
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
        <span className="text-xs tabular-nums">
          {row.original.price != null ? formatPrice(row.original.price) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">
          {formatCount(row.original.stock)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const offer = row.original;
        // A live offer may sell down to zero; only flag stock before it goes live.
        const gaps =
          offer.status === "ACTIVE"
            ? offer.missing.filter((field) => field !== "stock")
            : offer.missing;
        return (
          <div className="space-y-1">
            <StatusBadge
              status={offer.status}
              label={listingStatusLabel(offer.status)}
            />
            {gaps.length > 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                {describeMissing(gaps)}
              </p>
            ) : null}
            {offer.createdBy?.grantId ? (
              <p className="text-muted-foreground text-xs">Added by Print</p>
            ) : null}
          </div>
        );
      },
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
            <DropdownMenuItem
              disabled={onboarding && row.original.status !== "DRAFT"}
              onClick={() => openEditDrawer(row.original)}
            >
              Edit
            </DropdownMenuItem>
            {canRemove ? (
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
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4">
        <ScannerBar
          onScan={(isbn) =>
            router.push(
              `/inventory/create?isbn=${encodeURIComponent(isbn)}`,
            )
          }
        />
      </div>
      <DataTable
        data={inventory}
        columns={columns}
        totalPages={totalPages}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        isLoading={isLoading}
      >
        <div className="mb-4 w-full">
          <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={status ?? "ALL"}
              onValueChange={(value) => {
                if (!value) return;
                setSelectedIds(new Set());
                onStatusChange(
                  value === "ALL"
                    ? undefined
                    : (value as SellerListingStatusFilter),
                );
              }}
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((filter) => {
                const n =
                  filter.value === "ALL"
                    ? undefined
                    : statusCounts.data?.[filter.value];
                return (
                  <ToggleGroupItem
                    key={filter.value}
                    value={filter.value}
                    className="px-3"
                  >
                    {filter.label}
                    {n ? (
                      <span className="text-muted-foreground ml-1 tabular-nums">
                        {n}
                      </span>
                    ) : null}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
            <Button asChild>
              <Link href="/inventory/create">
                <PlusCircleIcon className="mr-2 size-4" />
                Add to inventory
              </Link>
            </Button>
          </div>
        </div>
      </DataTable>
      {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </>
  );
}
