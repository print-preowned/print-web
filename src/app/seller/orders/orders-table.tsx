"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import {
  OrderSummary,
  readBusinessOrders,
} from "@/lib/api/order";
import { apiFetch } from "@/lib/api";
import { usePrivilege } from "@/lib/auth/context";
import { getSellerPaymentStatusBadgeLabel } from "@/lib/order-status";
import { PaginatedResponse } from "@/lib/model";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function OrdersTable() {
  const [page, setPage] = useState(1);
  const hasReadOrder = usePrivilege("READ_ORDER");

  const query = useQuery<PaginatedResponse<OrderSummary>>({
    queryKey: ["business-orders", page],
    queryFn: () =>
      apiFetch(readBusinessOrders({ page, size: 10 })),
    enabled: hasReadOrder,
  });

  const data = query.data?.data ?? [];
  const totalPages = query.data?.pagination?.total_pages ?? 1;

  const columns: ColumnDef<OrderSummary>[] = [
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => (
        <Link
          href={`/seller/orders/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.reference}
        </Link>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: "Fulfillment",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ row }) => {
        const paymentStatus = row.original.payment_status ?? "NONE";
        return (
          <StatusBadge
            status={paymentStatus}
            label={getSellerPaymentStatusBadgeLabel(paymentStatus)}
          />
        );
      },
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => row.original.item_count.toLocaleString(),
    },
    {
      id: "total",
      header: "Your total",
      cell: ({ row }) =>
        formatPrice(row.original.total_amount, row.original.currency),
    },
    {
      accessorKey: "created_at",
      header: "Placed",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/seller/orders/${row.original.id}`}>View</Link>
        </Button>
      ),
      enableHiding: false,
    },
  ];

  if (!hasReadOrder) {
    return (
      <p className="text-sm text-muted-foreground">
        You don&apos;t have permission to view orders.
      </p>
    );
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      meta={{}}
      isLoading={query.isLoading}
      totalPages={totalPages}
      pageIndex={page - 1}
      pageSize={10}
      onPaginationChange={(updater) => {
        const next =
          typeof updater === "function"
            ? updater({ pageIndex: page - 1, pageSize: 10 })
            : updater;
        setPage(next.pageIndex + 1);
      }}
    />
  );
}
