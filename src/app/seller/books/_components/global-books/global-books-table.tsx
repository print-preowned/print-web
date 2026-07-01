"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { BookTableTitleCell } from "@/components/books/book-table-title-cell";
import { Book } from "@/lib/api/book";
import { createBusinessBook } from "@/lib/api/business-book";
import { businessBookKeys } from "@/lib/api/query-keys";
import { useBusinessId } from "@/lib/auth/context";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { toast } from "sonner";
import { RequestBookEditDialog } from "../requests/request-book-edit-dialog";
import { AddBookToInventoryForm } from "./add-to-inventory-form";
import { ChevronDown, FileEdit, PlusCircleIcon } from "lucide-react";

export interface GlobalBooksTableProps {
  selectedIds: Set<string>;
  onSelectId: (ids: Set<string>) => void;
  books: Book[];
  isLoading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  totalPages: number;
  searchApplied: string;
  setSearchApplied: (value: string) => void;
}

export function GlobalBooksTable(props: GlobalBooksTableProps) {
  const {
    selectedIds,
    onSelectId: setSelectedIds,
    books,
    isLoading,
    pagination,
    setPagination,
    totalPages,
    searchApplied,
    setSearchApplied,
  } = props;
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const [search, setSearch] = useState("");
  const [requestEditBook, setRequestEditBook] = useState<Book | null>(null);

  const addToInventoryMutation = useApiMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessBookKeys.all });
      toast.success("Added to your inventory");
    },
    onError: (e: Error) =>
      toast.error(e.message || "Failed to add (may already be in inventory)"),
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
    (books: Book[]) => {
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

  const selectedBooks = books.filter((b) => selectedIds.has(b.id));
  const singleSelected = selectedBooks.length === 1 ? selectedBooks[0] : null;
  const hasSelection = selectedIds.size > 0;

  const handleRequestEdit = useCallback(() => {
    if (singleSelected) setRequestEditBook(singleSelected);
  }, [singleSelected]);

  const handleAddToInventory = useCallback(() => {
    selectedBooks.forEach((book) =>
      addToInventoryMutation.mutate(createBusinessBook({ book_id: book.id })),
    );
    setSelectedIds(new Set());
  }, [selectedBooks, addToInventoryMutation, setSelectedIds]);

  const columns: ColumnDef<Book>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const booksOnPage = table.getRowModel().rows.map((r) => r.original);
        const selectedOnPageCount = booksOnPage.reduce(
          (count, b) => count + (selectedIds.has(b.id) ? 1 : 0),
          0,
        ); 
        const pageCount = booksOnPage.length;
        const allSelected = pageCount > 0 && selectedOnPageCount === pageCount;
        const someSelected = selectedOnPageCount > 0;
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
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <BookTableTitleCell
          title={row.original.title}
          image={row.original.image}
        />
      ),
    },
    {
      id: "authors",
      header: "Authors",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.authors?.length
            ? row.original.authors.map((a) => a.name).join(", ")
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  if (!businessId) {
    return (
      <p className="text-muted-foreground text-sm">
        Switch to a business context to add books to your inventory.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Search the global book catalog. Add books to your inventory or request
        edits (e.g. merge duplicates, correct details) via platform admin.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by title or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && setSearchApplied(search.trim())
          }
          className="max-w-xs"
        />
        <Button
          variant="secondary"
          onClick={() => setSearchApplied(search.trim())}
        >
          Search
        </Button>
        {searchApplied && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setSearchApplied("");
            }}
          >
            Clear
          </Button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-1"
              >
                Actions
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                disabled={selectedIds.size !== 1}
                onClick={handleRequestEdit}
              >
                <FileEdit className="size-4 mr-2" />
                Request for edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={selectedIds.size === 0}
                onClick={handleAddToInventory}
              >
                <PlusCircleIcon className="size-4 mr-2" />
                Add to inventory
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() =>
              openDrawer({
                title: "Create new book (provisional)",
                description:
                  "Add a book that isn’t in the global catalog yet. It will be added to your inventory and can be updated by platform admin later.",
                children: (
                  <AddBookToInventoryForm onSuccess={closeDrawer} />
                ),
              })
            }
            className="gap-1"
          >
            <PlusCircleIcon className="size-4" />
            Create
          </Button>
        </div>
      </div>
      <DataTable
        data={books}
        columns={columns}
        totalPages={totalPages}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        isLoading={isLoading}
      />
      
      <RequestBookEditDialog
        book={requestEditBook}
        open={!!requestEditBook}
        onOpenChange={(open) => !open && setRequestEditBook(null)}
      />
      {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </div>
  );
}
