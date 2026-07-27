"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FulfillmentAddressPanel } from "@/components/address/fulfillment-address-panel";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import {
  BusinessOrderDetail,
  OrderFulfillmentStatus,
  formatOrderAmount,
  readBusinessOrderById,
} from "@/lib/api/order";
import { usePrivilege } from "@/lib/auth/context";
import { canUpdateOrderStatus, nextOrderStatuses } from "@/lib/order-status";
import { useUpdateBusinessOrderStatus } from "@/lib/hooks/use-update-business-order-status";

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

function lineTotal(item: BusinessOrderDetail["items"][number]): number {
  return Number(item.unit_price) * item.quantity;
}

function OrderLineItem({
  item,
  currency,
}: {
  item: BusinessOrderDetail["items"][number];
  currency: string;
}) {
  return (
    <li className="flex flex-col gap-4 border-b border-border/60 py-4 last:border-b-0 sm:flex-row sm:items-start">
      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
        {item.image ? (
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-tight text-muted-foreground">
            No cover
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{item.book_title}</p>
        {item.author_names.length > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {item.author_names.join(", ")}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          {formatOrderAmount(Number(item.unit_price), currency)} ×{" "}
          {item.quantity}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold sm:text-right">
        {formatOrderAmount(lineTotal(item), currency)}
      </p>
    </li>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const hasReadOrder = usePrivilege("READ_ORDER");
  const hasUpdateOrder = usePrivilege("UPDATE_ORDER");

  const query = useQuery<OrderDetailResponse>({
    queryKey: ["business-order", orderId],
    queryFn: () => apiFetch(readBusinessOrderById(orderId)),
    enabled: hasReadOrder && Boolean(orderId),
  });

  const order = query.data?.data;
  const currentStatus = order?.status.trim().toUpperCase() ?? "";
  const fulfillmentType = order?.fulfillment_address?.fulfillment_type ?? "DELIVERY";
  const nextStatuses = order
    ? nextOrderStatuses(currentStatus, fulfillmentType)
    : [];

  const statusMutation = useUpdateBusinessOrderStatus();

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

      {hasUpdateOrder && canUpdateOrderStatus(order.status, fulfillmentType) ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Update status</p>
            <Select
              disabled={statusMutation.isPending}
              value={currentStatus}
              onValueChange={(value) => {
                if (value === currentStatus) return;
                statusMutation.mutate({
                  orderId,
                  status: value as OrderFulfillmentStatus,
                });
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

      {order.fulfillment_address ? (
        <FulfillmentAddressPanel address={order.fulfillment_address} />
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Your items</h2>
        <ul className="rounded-lg border px-4">
          {order.items.map((item) => (
            <OrderLineItem
              key={item.id}
              item={item}
              currency={order.currency}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
