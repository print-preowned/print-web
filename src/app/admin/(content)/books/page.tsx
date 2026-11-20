"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/data-table";
import { BottomDetailsPanel } from "@/components/bottom-details-panel";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Book, deleteBook, readBooks, createBook } from "@/lib/api/book";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import usePagination from "@/lib/pagination/usePagination";
import { BookTableTitleCell } from "@/components/books/book-table-title-cell";
import { firstImage } from "@/lib/cover";
import { EllipsisVertical, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { useMutation } from "@tanstack/react-query";
import { BulkUpload } from "@/components/bulk-upload";
import { parseCSV } from "@/lib/utils/csv";

type BookCSVRow = {
  title: string;
  image: string;
  description: string;
  status?: string;
};

function BookDetails({ book }: { book: Book }) {
  const cover = firstImage(book.images);
  const authors = book.authors ?? [];
  const genres = book.genres ?? [];

  return (
    <div className="grid gap-4 pb-4 sm:grid-cols-[auto_1fr]">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          className="h-32 w-24 rounded border object-cover"
        />
      ) : null}
      <div className="flex min-w-0 flex-col gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Title</span>
          <p className="font-medium">{book.title.displayTitle}</p>
        </div>
        {authors.length ? (
          <div>
            <span className="text-muted-foreground">Authors</span>
            <p>{authors.map((author) => author.name).join(", ")}</p>
          </div>
        ) : null}
        {genres.length ? (
          <div>
            <span className="text-muted-foreground">Genres</span>
            <p>{genres.map((genre) => genre.name).join(", ")}</p>
          </div>
        ) : null}
        <div>
          <span className="text-muted-foreground">Status</span>
          <p>
            <StatusBadge status={book.status} />
          </p>
        </div>
        {book.description ? (
          <div>
            <span className="text-muted-foreground">Description</span>
            <p className="line-clamp-4">{book.description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminBooksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsPanelHeightPx, setDetailsPanelHeightPx] = useState(0);

  const {
    data: books,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Book>({
    queryKey: ["books"],
    getUrl: ({ page, size }) => readBooks({ page, size }),
    initialPageSize: 15,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      setSelectedIds(new Set());
    }, 500);
    return () => clearTimeout(timer);
  }, [search, setPagination]);

  const singleSelected = useMemo(() => {
    const selected = books.filter((book) => selectedIds.has(book.id));
    return selected.length === 1 ? selected[0] : null;
  }, [books, selectedIds]);

  const toggleRow = useCallback(
    (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
    },
    [selectedIds],
  );

  const toggleAllOnPage = useCallback(
    (booksOnPage: Book[]) => {
      const next = new Set(selectedIds);
      const pageIds = booksOnPage.map((book) => book.id);
      const allSelected =
        booksOnPage.length > 0 && booksOnPage.every((book) => next.has(book.id));
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      setSelectedIds(next);
    },
    [selectedIds],
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint } = deleteBook(id);
      return apiFetch(endpoint, { method: "DELETE" });
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Book deleted successfully");
    },
  });

  const columns: ColumnDef<Book & { id: string }>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const booksOnPage = table.getRowModel().rows.map((row) => row.original);
        const selectedOnPageCount = booksOnPage.reduce(
          (count, book) => count + (selectedIds.has(book.id) ? 1 : 0),
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
          image={firstImage(row.original.images)}
        />
      ),
    },
    {
      accessorKey: "authors",
      header: "Authors",
      cell: ({ row }) => {
        const authors = row.original.authors ?? [];
        return (
          <span className="text-muted-foreground text-xs">
            {authors.length ? authors.map((a) => a.name).join(", ") : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "genres",
      header: "Genres",
      cell: ({ row }) => {
        const genres = row.original.genres ?? [];
        return (
          <span className="text-muted-foreground text-xs">
            {genres.length ? genres.map((g) => g.name).join(", ") : "—"}
          </span>
        );
      },
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
        <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
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
            <DropdownMenuItem asChild>
              <Link href={`/books/${row.original.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this book?")) {
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
    <div className="relative min-h-full">
      <div
        className="space-y-4 mb-6"
        style={
          detailsPanelHeightPx > 0
            ? { paddingBottom: detailsPanelHeightPx }
            : undefined
        }
      >
        <div className="flex gap-8 justify-between">
          <div className="flex gap-4">
            <SearchInput
              wrapperClassName="flex-1"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/books/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Book
              </Link>
            </Button>
          </div>
        </div>

        {!books.length && isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            meta={{
              onDelete: (id: string) => deleteMutation.mutate(id),
            }}
            data={books}
            totalPages={totalPages}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPaginationChange={setPagination}
            isLoading={isLoading}
          />
        )}
      </div>

      <BottomDetailsPanel
        open={singleSelected != null}
        ariaLabel="Book details"
        title=""
        onHeightChange={setDetailsPanelHeightPx}
      >
        {singleSelected ? <BookDetails book={singleSelected} /> : null}
      </BottomDetailsPanel>
    </div>
  );
}
