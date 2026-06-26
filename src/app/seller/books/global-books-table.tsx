"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Book } from "@/lib/api/book";
import { createBusinessBook } from "@/lib/api/business-book";
import { apiFetch } from "@/lib/api";
import { useBusinessId } from "@/lib/auth/context";
import { toast } from "sonner";
import { RequestBookEditDialog } from "./request-book-edit-dialog";
import { AddBookToCatalogForm } from "./add-to-catalog-form";
import { ChevronDown, FileEdit, PlusCircleIcon, X } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [requestEditBook, setRequestEditBook] = useState<Book | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const addToCatalogMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const req = createBusinessBook({ book_id: bookId });
      return apiFetch(req.endpoint, { method: req.method, body: req.body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-books"] });
      toast.success("Added to your catalogue");
    },
    onError: (e: Error) =>
      toast.error(e.message || "Failed to add (may already be in catalogue)"),
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

  const handleAddToCatalogue = useCallback(() => {
    selectedBooks.forEach((book) => addToCatalogMutation.mutate(book.id));
    setSelectedIds(new Set());
  }, [selectedBooks]);

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
        <span className="font-medium">{row.original.title}</span>
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
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.status}
        </Badge>
      ),
    },
  ];

  if (!businessId) {
    return (
      <p className="text-muted-foreground text-sm">
        Switch to a business context to add books to your catalogue.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Search the global book catalog. Add books to your catalogue or request
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
                onClick={handleAddToCatalogue}
              >
                <PlusCircleIcon className="size-4 mr-2" />
                Add to catalogue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setCreateDrawerOpen(true)}
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
      <Sheet open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Create new book (provisional)</SheetTitle>
            <SheetDescription>
              Add a book that isn’t in the global catalog yet. It will be added
              to your catalogue and can be updated by platform admin later.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <AddBookToCatalogForm
              onSuccess={() => setCreateDrawerOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
