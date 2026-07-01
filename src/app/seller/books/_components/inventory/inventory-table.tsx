"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { BusinessBookEditTabs } from "./business-book-edit-tabs";
import { AddBookToInventoryForm } from "../global-books/add-to-inventory-form";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { listingStatusLabel } from "@/lib/business-book-listing-status";
import { EllipsisVertical, PlusCircleIcon } from "lucide-react";
import { BookTableTitleCell } from "@/components/books/book-table-title-cell";
import {
  BusinessBook,
  deleteBusinessBook,
  readBusinessBooks,
} from "@/lib/api/business-book";
import { businessBookKeys } from "@/lib/api/query-keys";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/lib/api/user";
import { useBusinessId } from "@/lib/auth/context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiMutation } from "@/lib/hooks/useApiMutation";

function formatCount(value: number) {
  return value.toLocaleString();
}

function formatPrice(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface InventoryTableProps {
  selectedIds: Set<string>;
  onSelectId: (ids: Set<string>) => void;
  books: BusinessBook[];
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
  books: inventory,
  isLoading,
  pagination,
  setPagination,
  totalPages,
}: InventoryTableProps) {
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  const deleteMutation = useApiMutation<unknown>({
    onSuccess: () => {
      toast.success("Removed from inventory");
      void queryClient.invalidateQueries({ queryKey: businessBookKeys.all });
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
    (
      businessBook: BusinessBook,
      initialTab: "listing" | "variants" = "listing",
    ) => {
      openDrawer({
        title: "Edit listing",
        description: "Update your listing or manage variants",
        children: (
          <BusinessBookEditTabs
            businessBook={businessBook}
            initialTab={initialTab}
            onSuccess={closeDrawer}
          />
        ),
      });
    },
    [openDrawer, closeDrawer],
  );

  const handleAddedToInventory = useCallback(
    async (bookId: string) => {
      closeDrawer();
      await queryClient.invalidateQueries({ queryKey: businessBookKeys.all });
      const res = await queryClient.fetchQuery({
        queryKey: businessBookKeys.lookupByBookId(bookId),
        queryFn: () =>
          apiFetch<PaginatedResponse<BusinessBook>>(
            readBusinessBooks({ page: 1, size: 100 }),
          ),
      });
      const listing = res.data.find((b) => b.book_id === bookId) ?? null;
      if (listing) {
        toast.message("Set up your first variant", {
          description:
            "Add condition, format, price, and stock to start selling.",
        });
        openEditDrawer(listing, "variants");
      }
    },
    [closeDrawer, queryClient, openEditDrawer],
  );

  const toggleAllOnPage = useCallback(
    (books: BusinessBook[]) => {
      const next = new Set(selectedIds);
      const pageIds = new Set(books.map((b) => b.id));
      const allSelected =
        books.length > 0 && books.every((b) => next.has(b.id));
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      setSelectedIds(next);
    },
    [selectedIds, setSelectedIds],
  );

  const columns: ColumnDef<BusinessBook>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const booksOnPage = table.getRowModel().rows.map((r) => r.original);
        const allSelected =
          booksOnPage.length > 0 &&
          booksOnPage.every((b) => selectedIds.has(b.id));
        const someSelected = booksOnPage.some((b) => selectedIds.has(b.id));
        return (
          <Checkbox
            checked={
              allSelected ? true : someSelected ? "indeterminate" : false
            }
            onCheckedChange={() => toggleAllOnPage(booksOnPage)}
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
      accessorKey: "book_title",
      header: "Book",
      cell: ({ row }) => (
        <BookTableTitleCell
          title={row.original.book_title ?? row.original.book_id}
          image={row.original.image ?? row.original.book_image}
        />
      ),
    },
    {
      accessorKey: "variant_count",
      header: "Variants",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">
          {formatCount(row.original.variant_count ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "min_price",
      header: "From",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">
          {row.original.min_price != null
            ? formatPrice(row.original.min_price)
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "total_stock",
      header: "Stock",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">
          {formatCount(row.original.total_stock ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "synopsis",
      header: "Synopsis",
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-xs truncate block text-xs">
          {row.original.synopsis ?? "—"}
        </span>
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
              Edit listing
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openEditDrawer(row.original, "variants")}
            >
              Manage variants
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    "Remove this book from your inventory? Your listing will be removed.",
                  )
                ) {
                  deleteMutation.mutate(deleteBusinessBook(row.original.id));
                }
              }}
            >
              Remove from inventory
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!businessId) {
    return (
      <p className="text-muted-foreground text-sm">
        Switch to a business context to manage your inventory.
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
                description: "Search books or create a provisional one",
                children: (
                  <AddBookToInventoryForm onAdded={handleAddedToInventory} />
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
