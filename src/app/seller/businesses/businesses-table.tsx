"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable, DrawerContentType } from "@/components/data-table";
import z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleCheckBigIcon, EllipsisVertical, PlusCircleIcon } from "lucide-react";
import { BusinessForm, schema } from "./form";
import { Business, readBusinesses, createBusiness, updateBusiness, deleteBusiness } from "@/lib/api/business";
import { apiFetch } from "@/lib/api";
import { useIsOwner } from "@/lib/auth/context";
import { toast } from "sonner";

export function BusinessesTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const isOwner = useIsOwner();

  const query = useQuery({
    queryKey: [readBusinesses({ page, size: 10, search: search || undefined })],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Server must enforce authorization - client checks are for UX only
      const { endpoint } = deleteBusiness(id);
      return apiFetch(endpoint, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Business deleted successfully");
      query.refetch();
    },
    onError: (error: Error) => {
      // Server will return 403/401 if unauthorized
      toast.error(error.message || "Failed to delete business");
    },
  });

  const data = (query.data as { data?: Business[] } | undefined)?.data || [];

  const columns: ColumnDef<z.infer<typeof schema> & { id: string }>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null | undefined;
        return (
          <div className="max-w-[300px] truncate text-sm text-muted-foreground">
            {description || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row, table }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8 justify-self-end" size="icon">
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {isOwner && (
              <DropdownMenuItem
                onClick={() =>
                  table.options.meta?.onDrawerChange?.(
                    DrawerContentType.BusinessForm,
                    row.original
                  )
                }
              >
                Edit
              </DropdownMenuItem>
            )}
            {isOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this business?")) {
                      deleteMutation.mutate(row.original.id);
                    }
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableHiding: false,
    },
  ];

  return (
    <div>
      <DataTable
        data={data.map((d: Business) => schema.parse(d))}
        columns={columns}
        meta={{
          onDelete: isOwner ? (id: string) => deleteMutation.mutate(id) : undefined,
          onDrawerChange: (contentType: DrawerContentType, contentData: any) => {
            // Handle drawer open
          },
        }}
      >
        <div className="flex mb-4">
          <Button
            onClick={() => {
              // Handle create
            }}
          >
            <PlusCircleIcon className="size-4" />
            Add Business
          </Button>
        </div>
      </DataTable>
    </div>
  );
}

