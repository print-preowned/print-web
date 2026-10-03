"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookTableTitleCell } from "@/components/books/book-table-title-cell";
import { type CatalogWork } from "@/app/seller/lib/api/inventory";
import { RequestBookEditDialog } from "../requests/request-book-edit-dialog";
import { ChevronDown, FileEdit } from "lucide-react";

export interface GlobalBooksTableProps {
  selectedIds: Set<string>;
  onSelectId: (ids: Set<string>) => void;
  books: CatalogWork[];
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
  const [search, setSearch] = useState("");
  const [requestEditWork, setRequestEditWork] = useState<CatalogWork | null>(null);

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
    (books: CatalogWork[]) => {
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

  const handleRequestEdit = useCallback(() => {
    if (singleSelected) setRequestEditWork(singleSelected);
  }, [singleSelected]);

  const columns: ColumnDef<CatalogWork>[] = [
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
          title={row.original.title.displayTitle}
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
      cell: ({ row }) => (row.original.status ? <StatusBadge status={row.original.status} /> : "—"),
    },
  ];


  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Search the catalog to request edits (for example merge duplicates
        or correct details). Add offers from My inventory.
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
            </DropdownMenuContent>
          </DropdownMenu>
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
        book={requestEditWork}
        open={!!requestEditWork}
        onOpenChange={(open) => !open && setRequestEditWork(null)}
      />
    </div>
  );
}
