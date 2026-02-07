"use client";

import {
  ReactNode,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
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
import { toast } from "sonner";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { UserForm } from "@/app/seller/users/form";
import { BookForm } from "@/app/seller/books/form";
import { BusinessBookForm } from "@/app/seller/books/business-book-form";
import { AddBookToCatalogForm } from "@/app/seller/books/add-to-catalog-form";
import { AuthorForm } from "@/app/seller/authors/form";
import { BusinessForm } from "@/app/seller/businesses/form";
import { AdminBookForm } from "@/app/admin/(content)/books/form";
import { AdminAuthorForm } from "@/app/admin/(content)/authors/form";
import { AdminGenreForm } from "@/app/admin/(content)/genres/form";
import { Loader2 } from "lucide-react";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends unknown> {
    onDelete?: (id: string) => void;
    onDrawerChange?: (contentType: DrawerContentType, contentData: any) => void;
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

export interface DataTableRef {
  openDrawer: (contentType: DrawerContentType, contentData?: any) => void;
}

export interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  meta?: {
    onDelete?: (id: string) => void;
    onDrawerChange?: (contentType: DrawerContentType, contentData: any) => void;
  };
  children?: ReactNode;
  isLoading: boolean | undefined;
  data: T[];
  totalPages: number | undefined;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: OnChangeFn<PaginationState>
}

export const DataTable = forwardRef<DataTableRef, DataTableProps<any>>(
  function DataTable<T extends { id: string }>(
    { columns, meta, children, data, pageIndex, pageSize, onPaginationChange, isLoading, totalPages = 1 }: DataTableProps<T>,
    ref: React.ForwardedRef<DataTableRef>,
  ) {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
      {},
    );
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const pagination = { pageIndex, pageSize };
    const isServerPagination = totalPages != null && totalPages >= 0;
    const canPreviousPage = pageIndex > 0;
    const canNextPage = pageIndex < (totalPages ?? 1) - 1;
    const [drawerContent, setDrawerContent] =
      useState<DrawerContentType | null>(null);
    const [drawerData, setDrawerData] = useState<any>(null);

    const onDrawerChange = (
      contentType: DrawerContentType,
      contentData: any,
    ) => {
      setDrawerContent(contentType);
      setDrawerData(contentData);
      // Also call the external handler if provided
      meta?.onDrawerChange?.(contentType, contentData);
    };

    const onDrawerClose = () => {
      setDrawerContent(null);
      setDrawerData(null);
    };

    useImperativeHandle(ref, () => ({
      openDrawer: (contentType: DrawerContentType, contentData?: any) => {
        onDrawerChange(contentType, contentData);
      },
    }));

    const table = useReactTable({
      data,
      columns,
      meta: { onDrawerChange, ...meta },
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
      <>
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
              {/* <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div> */}
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
        {drawerContent && (
          <TableCellViewer
            contentType={drawerContent}
            contentData={drawerData}
            onClose={onDrawerClose}
          />
        )}
      </>
    );
  },
);

export enum DrawerContentType {
  UserForm = "user-form",
  BookForm = "book-form",
  BusinessBookForm = "business-book-form",
  AddBookToCatalog = "add-book-to-catalog",
  AuthorForm = "author-form",
  BusinessForm = "business-form",
  AdminBookForm = "admin-book-form",
  AdminAuthorForm = "admin-author-form",
  AdminGenreForm = "admin-genre-form",
}

export function TableCellViewer({
  contentType,
  contentData,
  onClose,
}: {
  contentType: DrawerContentType;
  contentData: any;
  onClose?: () => void;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Open drawer when this viewer is shown (parent set contentType/contentData).
  useEffect(() => {
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  // When user dismisses drawer (overlay/escape), clear parent state so re-opening same item remounts and opens again.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) onClose?.();
  };

  var getData = (contentType: DrawerContentType) => {
    switch (contentType) {
      case DrawerContentType.UserForm:
        return {
          content: <UserForm user={contentData} />,
          header: "User Form",
          description: "Edit user details",
        };
      case DrawerContentType.BookForm:
        return {
          content: <BookForm book={contentData} />,
          header: "Book Form",
          description: "Edit book details",
        };
      case DrawerContentType.BusinessBookForm:
        return {
          content: (
            <BusinessBookForm
              businessBook={contentData}
              onSuccess={handleClose}
            />
          ),
          header: "Edit listing",
          description: "Update your catalog listing for this book",
        };
      case DrawerContentType.AddBookToCatalog:
        return {
          content: <AddBookToCatalogForm onSuccess={handleClose} />,
          header: "Add to catalog",
          description: "Search books or create a provisional one",
        };
      case DrawerContentType.AuthorForm:
        return {
          content: <AuthorForm author={contentData} />,
          header: "Author Form",
          description: "Edit author details",
        };
      case DrawerContentType.BusinessForm:
        return {
          content: <BusinessForm business={contentData} />,
          header: "Business Form",
          description: "Edit business details",
        };
      case DrawerContentType.AdminBookForm:
        return {
          content: <AdminBookForm book={contentData} onSuccess={handleClose} />,
          header: contentData ? "Edit Book" : "Create Book",
          description: contentData ? "Update book details" : "Add a new book",
        };
      case DrawerContentType.AdminAuthorForm:
        return {
          content: (
            <AdminAuthorForm author={contentData} onSuccess={handleClose} />
          ),
          header: contentData ? "Edit Author" : "Create Author",
          description: contentData
            ? "Update author details"
            : "Add a new author",
        };
      case DrawerContentType.AdminGenreForm:
        return {
          content: (
            <AdminGenreForm genre={contentData} onSuccess={handleClose} />
          ),
          header: contentData ? "Edit Genre" : "Create Genre",
          description: contentData ? "Update genre details" : "Add a new genre",
        };
      default:
        return {
          content: <div>Unknown Form</div>,
          header: "Unknown Form",
          description: "Unknown form type",
        };
    }
  };

  const data = getData(contentType);

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{data.header}</DrawerTitle>
          {data.description && (
            <DrawerDescription>
              {data.description ?? "Describe"}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {data.content}
        </div>
        {/* <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
