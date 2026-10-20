"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
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
            <DropdownMenuItem asChild>
              <Link href={`/admin/authors/${row.original.id}/edit`}>Edit</Link>
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
            <Button asChild>
              <Link href="/admin/authors/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Author
              </Link>
            </Button>
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
    </div>
  );
}
