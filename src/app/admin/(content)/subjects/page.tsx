"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminSubjectForm } from "@/app/admin/(content)/subjects/form";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
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
import { deleteSubject, readSubjectsListUrl, type Subject } from "@/lib/api/subject";
import usePagination from "@/lib/pagination/usePagination";

export default function AdminSubjectsPage() {
  const queryClient = useQueryClient();
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const [search, setSearch] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: subjects,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Subject>({
    queryKey: ["subjects", debouncedSearch, schemeFilter],
    getUrl: ({ page, size, search: subjectSearch, scheme }) =>
      readSubjectsListUrl({
        page,
        size,
        filter: {
          search: (subjectSearch as string) || undefined,
          scheme: scheme !== "all" ? (scheme as string) : undefined,
        },
      }),
    initialPageSize: 10,
    params: { search: debouncedSearch, scheme: schemeFilter },
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, schemeFilter, setPagination]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const request = deleteSubject(id);
      return apiFetch(request.endpoint, { method: request.method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete subject");
    },
  });

  const columns: ColumnDef<Subject>[] = [
    {
      accessorKey: "heading",
      header: "Heading",
      cell: ({ row }) => <span className="font-medium">{row.original.heading}</span>,
    },
    {
      accessorKey: "scheme",
      header: "Scheme",
      cell: ({ row }) =>
        row.original.scheme === "OL_SUBJECT" ? "Open Library" : row.original.scheme,
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => row.original.code || "—",
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
                  title: "Edit subject",
                  description: "Update the classification",
                  children: <AdminSubjectForm subject={row.original} onSuccess={closeDrawer} />,
                })
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (confirm(`Delete ${row.original.heading}?`)) {
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
            placeholder="Search subjects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={schemeFilter} onValueChange={setSchemeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by scheme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All schemes</SelectItem>
              <SelectItem value="BISAC">BISAC</SelectItem>
              <SelectItem value="THEMA">Thema</SelectItem>
              <SelectItem value="LCSH">LCSH</SelectItem>
              <SelectItem value="OL_SUBJECT">Open Library</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() =>
            openDrawer({
              title: "Create subject",
              description: "A source classification. It stays off the genre list.",
              children: <AdminSubjectForm onSuccess={closeDrawer} />,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Create subject
        </Button>
      </div>

      {!subjects.length && isLoading ? (
        <div className="py-8 text-center">Loading...</div>
      ) : (
        <DataTable
          data={subjects}
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
