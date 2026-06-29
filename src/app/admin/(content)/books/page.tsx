"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { AdminBookForm } from "@/app/admin/(content)/books/form";
import { useQueryClient } from "@tanstack/react-query";
import { Book, deleteBook, readBooks } from "@/lib/api/book";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import usePagination from "@/lib/pagination/usePagination";
import { EllipsisVertical, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { BulkUpload } from "@/components/bulk-upload";
import { parseCSV } from "@/lib/utils/csv";
import { createBook } from "@/lib/api/book";

type BookCSVRow = {
  title: string;
  image: string;
  synopsis: string;
  status?: string;
};

export default function AdminBooksPage() {
  const queryClient = useQueryClient();
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const [search, setSearch] = useState("");

  const {
    data: books,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Book>({
    queryKey: ["books"],
    getUrl: ({ page, size }) => readBooks({ page, size }),
    initialPageSize: 5,
  });

  // Debounce search and reset to first page when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search, setPagination]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint } = deleteBook(id);
      return apiFetch(endpoint, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted successfully");
    },
  });

  const columns: ColumnDef<Book & { id: string }>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
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
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs ${
            row.original.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
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
            <DropdownMenuItem
              onClick={() =>
                openDrawer({
                  title: "Edit Book",
                  description: "Update book details",
                  children: (
                    <AdminBookForm
                      book={row.original}
                      onSuccess={closeDrawer}
                    />
                  ),
                })
              }
            >
              Edit
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
    <>
      <div className="space-y-4 mb-6">
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
            <Button
              onClick={() =>
                openDrawer({
                  title: "Create Book",
                  description: "Add a new book",
                  children: <AdminBookForm onSuccess={closeDrawer} />,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Book
            </Button>
            <BulkUpload<BookCSVRow>
              title="Bulk Upload Books"
              description="Upload multiple books from a CSV file. Each row should contain: title, image URL, synopsis, and optional status. Add genres per book via Edit after upload."
              sampleHeaders={["title", "image", "synopsis", "status"]}
              sampleRow={[
                "The Great Gatsby",
                "https://example.com/image.jpg",
                "A classic American novel",
                "ACTIVE",
              ]}
              parseCSV={(csvText) => {
                const rows = parseCSV(csvText);
                if (rows.length < 2) {
                  throw new Error(
                    "CSV must have header row and at least one data row",
                  );
                }
                const headers = rows[0].map((h) => h.trim().toLowerCase());
                return rows.slice(1).map((row) => {
                  const obj: any = {};
                  headers.forEach((header, idx) => {
                    obj[header] = row[idx]?.trim() || "";
                  });
                  return obj as BookCSVRow;
                });
              }}
              validateItem={(item, index) => {
                if (!item.title?.trim()) {
                  return { valid: false, error: "Title is required" };
                }
                if (!item.synopsis?.trim()) {
                  return { valid: false, error: "Synopsis is required" };
                }
                if (!item.image?.trim()) {
                  return { valid: false, error: "Image URL is required" };
                }
                return { valid: true };
              }}
              onUpload={async (items) => {
                let success = 0;
                let failed = 0;
                const errors: string[] = [];

                for (let i = 0; i < items.length; i++) {
                  try {
                    const item = items[i];
                    const request = await createBook({
                      title: item.title,
                      image: item.image,
                      synopsis: item.synopsis,
                    });

                    await apiFetch(request.endpoint, {
                      method: request.method,
                      body: request.body,
                    });

                    success++;
                  } catch (error) {
                    failed++;
                    errors.push(
                      `Row ${i + 2}: ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`,
                    );
                  }
                }

                if (success > 0) {
                  queryClient.invalidateQueries({ queryKey: ["books"] });
                }

                return { success, failed, errors };
              }}
            />
          </div>
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
      {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </>
  );
}
