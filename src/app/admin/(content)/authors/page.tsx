"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { AdminAuthorForm } from "@/app/admin/(content)/authors/form";
import { useQueryClient } from "@tanstack/react-query";
import { readAuthors, Author, createAuthor } from "@/lib/api/author";
import usePagination from "@/lib/pagination/usePagination";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/status-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Plus } from "lucide-react";
import { BulkUpload } from "@/components/bulk-upload";
import { parseCSV } from "@/lib/utils/csv";
import { apiFetch } from "@/lib/api";

type AuthorCSVRow = {
  given_names?: string;
  family_name?: string;
  about: string;
  image?: string;
  status?: string;
};

export default function AdminAuthorsPage() {
  const queryClient = useQueryClient();
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: authors,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Author>({
    queryKey: ["authors", debouncedSearch, statusFilter],
    getUrl: ({ page, size, search: s, status }) =>
      readAuthors({
        page,
        size,
        filter: {
          search: (s as string) || undefined,
          status: status !== "all" ? (status as string) : undefined,
        },
      }),
    initialPageSize: 10,
    params: { search: debouncedSearch, status: statusFilter },
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, statusFilter]);


  const columns: ColumnDef<Author>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.name.displayNameFlat}
        </span>
      ),
    },
    {
      accessorKey: "about",
      header: "About",
      cell: ({ row }) => (
        <span className="max-w-md truncate block">{row.original.about}</span>
      ),
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
            <DropdownMenuItem
              onClick={() =>
                openDrawer({
                  title: "Edit Author",
                  description: "Update author details",
                  children: (
                    <AdminAuthorForm
                      author={row.original}
                      onSuccess={closeDrawer}
                    />
                  ),
                })
              }
            >
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="space-y-4 mb-6">
        <div className="flex gap-8 justify-between">
          <div className="flex gap-4">
            <SearchInput
              wrapperClassName="flex-1"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="CANONICAL">Canonical</SelectItem>
                <SelectItem value="PROVISIONAL">Provisional</SelectItem>
                <SelectItem value="DEPRECATED">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() =>
                openDrawer({
                  title: "Create Author",
                  description: "Add a new author",
                  children: <AdminAuthorForm onSuccess={closeDrawer} />,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Author
            </Button>
            <BulkUpload<AuthorCSVRow>
              title="Bulk Upload Authors"
              description="Upload multiple authors from a CSV file. Each row should contain: given_names (optional), family_name, about, image (optional), and optional status."
              sampleHeaders={["given_names", "family_name", "about", "image", "status"]}
              sampleRow={["Chinua", "Achebe", "Award-winning fiction author", "https://example.com/image.jpg", "CANONICAL"]}
              parseCSV={(csvText) => {
                const rows = parseCSV(csvText);
                if (rows.length < 2) throw new Error("CSV must have header row and at least one data row");
                const headers = rows[0].map(h => h.trim().toLowerCase());
                return rows.slice(1).map(row => {
                  const obj: any = {};
                  headers.forEach((header, idx) => {
                    obj[header] = row[idx]?.trim() || "";
                  });
                  return obj as AuthorCSVRow;
                });
              }}
              validateItem={(item) => {
                if (!item.family_name?.trim() && !item.given_names?.trim()) {
                  return { valid: false, error: "Family name is required" };
                }
                if (!item.about?.trim()) {
                  return { valid: false, error: "About is required" };
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
                    const request = createAuthor({
                      name: {
                        keyNames: (item.family_name || item.given_names || "").trim(),
                        namesBeforeKey: item.family_name ? item.given_names?.trim() || null : null,
                      },
                      about: item.about,
                      image: item.image || "",
                      status: item.status === "ACTIVE" ? "CANONICAL" : item.status || "CANONICAL",
                    });
                    
                    await apiFetch(request.endpoint, {
                      method: request.method as "POST",
                      body: request.body,
                    });
                    
                    success++;
                  } catch (error) {
                    failed++;
                    errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`);
                  }
                }
                
                if (success > 0) {
                  queryClient.invalidateQueries({ queryKey: ["authors"] });
                }
                
                return { success, failed, errors };
              }}
            />
          </div>
        </div>
      </div>

      {!authors.length && isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <DataTable
          data={authors.map((author) => ({ ...author, id: author.id }))}
          columns={columns}
          meta={{}}
          totalPages={totalPages}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      )}
      {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </div>
  );
}
