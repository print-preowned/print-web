"use client";

import {
  ReactNode,
  useState,
} from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  OnChangeFn,
  PaginationState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends unknown> {
    onDelete?: (id: string) => void;
  }
}

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

export interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  meta?: {
    onDelete?: (id: string) => void;
  };
  children?: ReactNode;
  isLoading: boolean | undefined;
  data: T[];
  totalPages: number | undefined;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: OnChangeFn<PaginationState>
}

export function DataTable<T extends { id: string }>({
  columns,
  meta,
  children,
  data,
  pageIndex,
  pageSize,
  onPaginationChange,
  isLoading,
  totalPages = 1,
}: DataTableProps<T>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    {},
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const pagination = { pageIndex, pageSize };
  const isServerPagination = totalPages != null && totalPages >= 0;
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < (totalPages ?? 1) - 1;

  const table = useReactTable({
    data,
    columns,
    meta,
    state: {
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    manualPagination: isServerPagination,
    pageCount: isServerPagination ? (totalPages ?? 1) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(isServerPagination
      ? {}
      : { getPaginationRowModel: getPaginationRowModel() }),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const handleNextPage = () => {
    onPaginationChange({ pageIndex: pageIndex + 1, pageSize });
  };

  const handlePreviousPage = () => {
    onPaginationChange({ pageIndex: pageIndex - 1, pageSize });
  };

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between">{children}</div>
      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isActionsColumn = header.column.id === "actions";
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={
                          isActionsColumn
                            ? "sticky right-0 bg-muted z-20"
                            : ""
                        }
                      >
                        {header.isPlaceholder || isActionsColumn
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="group">
                    {row.getVisibleCells().map((cell) => {
                      const isActionsColumn = cell.column.id === "actions";
                      return (
                        <TableCell
                          key={cell.id}
                          className={
                            isActionsColumn
                              ? "sticky right-0 bg-background group-hover:bg-muted/95 z-10"
                              : ""
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {isLoading && (
              <TableRow>
                <td
                  colSpan={columns.length}
                  className="place-items-center h-10 bg-muted"
                >
                  <Loader2 className="size-4 animate-spin" />
                </td>
              </TableRow>
            )}
          </Table>
        </div>
        <div className="flex items-center justify-end px-4">
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label
                htmlFor="rows-per-page"
                className="text-sm font-medium"
              >
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  onPaginationChange((prev) => ({...prev, pageSize: Number(value)}));
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="w-20"
                  id="rows-per-page"
                >
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {totalPages}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!canPreviousPage}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={handlePreviousPage}
                disabled={!canPreviousPage}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={handleNextPage}
                disabled={!canNextPage}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!canNextPage}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
