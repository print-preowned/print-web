"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { AdminGenreForm } from "@/app/admin/(content)/genres/form";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { readGenresListUrl, Genre, deleteGenre } from "@/lib/api/genre";
import { apiFetch, apiErrorToast } from "@/lib/api";
import { toast } from "sonner";
import { Plus, EllipsisVertical } from "lucide-react";
import usePagination from "@/lib/pagination/usePagination";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function AdminGenresPage() {
  const queryClient = useQueryClient();
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: serverGenres,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Genre>({
    queryKey: ["genres", debouncedSearch],
    getUrl: ({ page, size, search: s }) =>
      readGenresListUrl({
        page,
        size,
        filter: {
          search: (s as string) || undefined,
        },
      }),
    initialPageSize: 10,
    params: { search: debouncedSearch },
  });

  const genres = serverGenres || [];

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint } = deleteGenre(id);
      return apiFetch(endpoint, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      toast.success("Genre deleted successfully");
    },
    onError: (error: Error) => {
      apiErrorToast(error, "Failed to delete genre");
    },
  });

  const columns: ColumnDef<Genre & { id: string }>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="max-w-md truncate block">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
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
                  title: "Edit Genre",
                  description: "Update genre details",
                  children: (
                    <AdminGenreForm
                      genre={row.original}
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
                if (confirm("Are you sure you want to delete this genre?")) {
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
      <div className="space-y-4 mb-6">
        <div className="flex gap-8 justify-between">
          <div className="flex gap-4">
            <SearchInput
              wrapperClassName="flex-1"
              placeholder="Search genres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() =>
                openDrawer({
                  title: "Create Genre",
                  description: "Add a new genre",
                  children: <AdminGenreForm onSuccess={closeDrawer} />,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Genre
            </Button>
          </div>
        </div>
      </div>

      {!genres.length && isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <DataTable
          data={genres.map((genre) => ({ ...genre, id: genre.id }))}
          columns={columns}
          meta={{
            onDelete: (id: string) => deleteMutation.mutate(id),
          }}
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
