"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminSeriesForm } from "@/app/admin/(content)/series/form";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { deleteSeries, readSeriesListUrl, type Series } from "@/lib/api/series";
import usePagination from "@/lib/pagination/usePagination";

export default function AdminSeriesPage() {
  const queryClient = useQueryClient();
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: series,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Series>({
    queryKey: ["series", debouncedSearch, statusFilter],
    getUrl: ({ page, size, search: seriesSearch, status }) =>
      readSeriesListUrl({
        page,
        size,
        filter: {
          search: (seriesSearch as string) || undefined,
          status: status !== "all" ? (status as string) : undefined,
        },
      }),
    initialPageSize: 10,
    params: { search: debouncedSearch, status: statusFilter },
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, statusFilter, setPagination]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const request = deleteSeries(id);
      return apiFetch(request.endpoint, { method: request.method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      toast.success("Series deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete series");
    },
  });

  const columns: ColumnDef<Series>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "issn",
      header: "ISSN",
      cell: ({ row }) => row.original.issn || "—",
    },
    {
      accessorKey: "publisherName",
      header: "Publisher",
      cell: ({ row }) => row.original.publisherName || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
                  title: "Edit series",
                  description: "Update the series title, ISSN, or publisher",
                  children: <AdminSeriesForm series={row.original} onSuccess={closeDrawer} />,
                })
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (confirm(`Delete ${row.original.title}?`)) {
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
    <div className="container mx-auto py-4 px-4">
      <div className="mb-6 flex justify-between gap-8">
        <div className="flex gap-4">
          <SearchInput
            wrapperClassName="flex-1"
            placeholder="Search series..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() =>
            openDrawer({
              title: "Create series",
              description: "A series numbers many works. Each publication keeps its own number.",
              children: <AdminSeriesForm onSuccess={closeDrawer} />,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Create series
        </Button>
      </div>

      {!series.length && isLoading ? (
        <div className="py-8 text-center">Loading...</div>
      ) : (
        <DataTable
          data={series}
          columns={columns}
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
