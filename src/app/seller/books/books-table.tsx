"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DataTable,
  DataTableRef,
  DrawerContentType,
} from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { EllipsisVertical, PlusCircleIcon } from "lucide-react";
import {
  BusinessBook,
  readBusinessBooks,
  deleteBusinessBook,
} from "@/lib/api/business-book";
import { apiFetch } from "@/lib/api";
import { useBusinessId } from "@/lib/auth/context";
import usePagination from "@/lib/pagination/usePagination";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function BooksTable() {
  const dataTableRef = useRef<DataTableRef>(null);
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  const {
    data: catalog,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<BusinessBook>({
    queryKey: ["business-books"],
    getUrl: ({ page, size }) => readBusinessBooks({ page, size }),
    initialPageSize: 10,
  });

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

  const columns: ColumnDef<BusinessBook>[] = [
    {
      accessorKey: "book_title",
      header: "Book",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.book_title ?? row.original.book_id}
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
        <Badge variant="outline" className="text-xs">
          {row.original.status}
        </Badge>
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
              onClick={() =>
                table.options.meta?.onDrawerChange?.(
                  DrawerContentType.BusinessBookForm,
                  row.original
                )
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
    <DataTable
      ref={dataTableRef}
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
            dataTableRef.current?.openDrawer(DrawerContentType.AddBookToCatalog)
          }
        >
          <PlusCircleIcon className="size-4 mr-2" />
          Add to catalog
        </Button>
      </div>
    </DataTable>
  );
}
