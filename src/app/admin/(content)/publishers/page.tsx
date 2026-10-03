"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminPublisherForm } from "@/app/admin/(content)/publishers/form";
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
import { deletePublisher, readPublishersListUrl, type Publisher } from "@/lib/api/publisher";
import usePagination from "@/lib/pagination/usePagination";

export default function AdminPublishersPage() {
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
    data: publishers,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Publisher>({
    queryKey: ["publishers", debouncedSearch, statusFilter],
    getUrl: ({ page, size, search: publisherSearch, status }) =>
      readPublishersListUrl({
        page,
        size,
        filter: {
          search: (publisherSearch as string) || undefined,
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
      const request = deletePublisher(id);
      return apiFetch(request.endpoint, { method: request.method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
      toast.success("Publisher deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete publisher");
    },
  });

  const columns: ColumnDef<Publisher>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "parentName",
      header: "Imprint of",
      cell: ({ row }) => row.original.parentName || "—",
    },
    {
      accessorKey: "countryCode",
      header: "Country",
      cell: ({ row }) => row.original.countryCode || "—",
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
                  title: "Edit publisher",
                  description: "Update the house or its imprint parent",
                  children: (
                    <AdminPublisherForm publisher={row.original} onSuccess={closeDrawer} />
                  ),
                })
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (confirm(`Delete ${row.original.name}?`)) {
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
            placeholder="Search publishers..."
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
              title: "Create publisher",
              description: "Add a house. An imprint points at its parent.",
              children: <AdminPublisherForm onSuccess={closeDrawer} />,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Create publisher
        </Button>
      </div>

      {!publishers.length && isLoading ? (
        <div className="py-8 text-center">Loading...</div>
      ) : (
        <DataTable
          data={publishers}
          columns={columns}
          totalPages={totalPages}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      )}
      {drawer ? <FormDrawer {...drawer} onClose={closeDrawer} /> : null}
    </div>
  );
}
