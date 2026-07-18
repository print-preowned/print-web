"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import {
  BusinessOrderDetail,
  OrderFulfillmentStatus,
  formatOrderAmount,
  readBusinessOrderById,
  updateBusinessOrderStatus,
} from "@/lib/api/order";
import { usePrivilege } from "@/lib/auth/context";
import { canUpdateOrderStatus, nextOrderStatuses } from "@/lib/order-status";

type OrderDetailResponse = {
  status_code: number;
  message: string;
  data: BusinessOrderDetail;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(status: string): string {
  const normalized = status.trim().toUpperCase();
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const queryClient = useQueryClient();
  const hasReadOrder = usePrivilege("READ_ORDER");
  const hasUpdateOrder = usePrivilege("UPDATE_ORDER");

  const query = useQuery<OrderDetailResponse>({
    queryKey: ["business-order", orderId],
    queryFn: () => apiFetch(readBusinessOrderById(orderId)),
    enabled: hasReadOrder && Boolean(orderId),
  });

  const order = query.data?.data;
  const currentStatus = order?.status.trim().toUpperCase() ?? "";
  const nextStatuses = order ? nextOrderStatuses(currentStatus) : [];

  const statusMutation = useMutation({
    mutationFn: async (status: OrderFulfillmentStatus) => {
      const req = updateBusinessOrderStatus(orderId, status);
      return apiFetch(req.endpoint, {
        method: req.method,
        body: req.body,
      });
    },
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["business-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["business-orders"] });
    },
  });

  if (!hasReadOrder) {
    return (
      <p className="text-sm text-muted-foreground">
        You don&apos;t have permission to view orders.
      </p>
    );
  }

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading order…</p>;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/seller/orders">
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/seller/orders">
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {order.reference}
          </h1>
          <p className="text-muted-foreground text-sm">
            Placed {formatDate(order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Your total</p>
          <p className="text-xl font-semibold">
            {formatOrderAmount(order.total_amount, order.currency)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Line items</p>
          <p className="text-xl font-semibold">{order.item_count}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Currency</p>
          <p className="text-xl font-semibold">{order.currency}</p>
        </div>
      </div>

      {hasUpdateOrder && canUpdateOrderStatus(order.status) ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Update status</p>
            <Select
              disabled={statusMutation.isPending}
              value={currentStatus}
              onValueChange={(value) => {
                if (value === currentStatus) return;
                statusMutation.mutate(value as OrderFulfillmentStatus);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Choose next status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentStatus} disabled>
                  {statusLabel(currentStatus)}
                </SelectItem>
                {nextStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Your items</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.book_title}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatOrderAmount(item.unit_price, item.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatOrderAmount(
                      item.unit_price * item.quantity,
                      item.currency,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
