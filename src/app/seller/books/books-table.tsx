"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { BusinessBookForm } from "@/app/seller/books/business-book-form";
import { AddBookToCatalogForm } from "@/app/seller/books/add-to-catalog-form";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { EllipsisVertical, PlusCircleIcon } from "lucide-react";
import { BookTableTitleCell } from "@/components/books/book-table-title-cell";
import { BusinessBook, deleteBusinessBook } from "@/lib/api/business-book";
import { apiFetch } from "@/lib/api";
import { useBusinessId } from "@/lib/auth/context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
 
export interface BooksTableProps {
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

export function BooksTable({
  selectedIds,
  onSelectId: setSelectedIds,
  books: catalog,
  isLoading,
  pagination,
  setPagination,
  totalPages,
}: BooksTableProps) {
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint } = deleteBusinessBook(id);
      return apiFetch(endpoint, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Removed from catalog");
      void queryClient.invalidateQueries({ queryKey: ["business-books"] });
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
    [selectedIds, setSelectedIds]
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
    [selectedIds, setSelectedIds]
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
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
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
          image={row.original.book_image ?? row.original.image}
        />
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
        <Badge variant="outline" className="text-xs">
          {row.original.status}
        </Badge>
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
            <DropdownMenuItem
              onClick={() =>
                openDrawer({
                  title: "Edit listing",
                  description: "Update your catalog listing for this book",
                  children: (
                    <BusinessBookForm
                      businessBook={row.original}
                      onSuccess={closeDrawer}
                    />
                  ),
                })
              }
            >
              Edit listing
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    "Remove this book from your catalog? Your listing will be removed."
                  )
                ) {
                  deleteMutation.mutate(row.original.id);
                }
              }}
            >
              Remove from catalog
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!businessId) {
    return (
      <p className="text-muted-foreground text-sm">
        Switch to a business context to manage your book catalog.
      </p>
    );
  }

  return (
    <>
    <DataTable
      data={catalog}
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
              title: "Add to catalog",
              description: "Search books or create a provisional one",
              children: <AddBookToCatalogForm onSuccess={closeDrawer} />,
            })
          }
        >
          <PlusCircleIcon className="size-4 mr-2" />
          Add to catalog
        </Button>
      </div>
    </DataTable>
    {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </>
  );
}
