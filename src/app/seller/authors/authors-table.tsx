"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CircleCheckBigIcon,
  EllipsisVertical,
  PlusCircleIcon,
} from "lucide-react";
import { AuthorForm, schema } from "./form";
import { Author, readAuthors, updateAuthor } from "@/lib/api/author";
import { apiFetch } from "@/lib/api";
import { usePrivilege } from "@/lib/auth/context";
import { toast } from "sonner";

export function AuthorsTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const hasReadAuthor = usePrivilege("READ_AUTHOR");
  const hasCreateAuthor = usePrivilege("CREATE_AUTHOR");
  const hasUpdateAuthor = usePrivilege("UPDATE_AUTHOR");

  const query = useQuery({
    queryKey: [readAuthors({ page, size: 10, search: search || undefined })],
    enabled: hasReadAuthor,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Author> }) => {
      // Server must enforce authorization - client checks are for UX only
      return apiFetch(updateAuthor(id, payload).endpoint, {
        method: updateAuthor(id, payload).method,
        body: updateAuthor(id, payload).body,
      });
    },
    onSuccess: () => {
      toast.success("Author updated successfully");
      query.refetch();
    },
    onError: (error: Error) => {
      // Server will return 403/401 if unauthorized
      toast.error(error.message || "Failed to update author");
    },
  });

  const data = query.data?.data || [];

  const columns: ColumnDef<z.infer<typeof schema> & { _id: string }>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.first_name}{" "}
          {row.original.middle_name && `${row.original.middle_name} `}
          {row.original.last_name}
        </span>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "followers",
      header: "Followers",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.followers?.toLocaleString() || "0"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status === "ACTIVE" ? (
            <CircleCheckBigIcon className="fill-green-500 dark:fill-green-400" />
          ) : null}
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
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
            {hasUpdateAuthor && (
              <DropdownMenuItem
                onClick={() =>
                  openDrawer({
                    title: "Author Form",
                    description: "Edit author details",
                    children: <AuthorForm author={row.original} />,
                  })
                }
              >
                Edit
              </DropdownMenuItem>
            )}
            {/* Authors cannot be deleted per MDC-AUTHOR-2 */}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableHiding: false,
    },
  ];

  if (!hasReadAuthor) {
    return (
      <p className="text-sm text-muted-foreground">
        You don't have permission to view authors.
      </p>
    );
  }

  return (
    <>
    <DataTable
      data={data.map((d) => schema.parse(d))}
      columns={columns}
      meta={{}}
      isLoading={query.isLoading}
      totalPages={1}
      pageIndex={page - 1}
      pageSize={10}
      onPaginationChange={(updater) => {
        const next =
          typeof updater === "function"
            ? updater({ pageIndex: page - 1, pageSize: 10 })
            : updater;
        setPage(next.pageIndex + 1);
      }}
    >
      <div className="flex mb-4">
        {hasCreateAuthor && (
          <Button
            onClick={() =>
              openDrawer({
                title: "Author Form",
                description: "Add a new author",
                children: <AuthorForm author={undefined} />,
              })
            }
          >
            <PlusCircleIcon className="size-4" />
            Add Author
          </Button>
        )}
      </div>
    </DataTable>
    {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </>
  );
}

