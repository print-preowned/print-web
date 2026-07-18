"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  formatOrderAmount,
  OrderSummary,
  OrderSummaryItemPreview,
} from "@/lib/api/order";
import {
  formatOrderPlacedDate,
  getCustomerOrderStatusCopy,
} from "@/lib/customer-order-display";
import { readCustomerOrders } from "@customer/api";
import { PaginatedResponse } from "@/lib/model";

function OrderItemPreview({ item }: { item: OrderSummaryItemPreview }) {
  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
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
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="line-clamp-2 font-medium leading-snug">{item.book_title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Qty {item.quantity}
        </p>
      </div>
    </li>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const statusCopy = getCustomerOrderStatusCopy(order.status);
  const hiddenItemCount = Math.max(
    0,
    order.item_count - order.preview_items.length,
  );

  return (
    <article className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="grid gap-4 border-b border-border/60 bg-muted/40 px-4 py-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Order placed
          </p>
          <p className="mt-0.5 text-sm font-medium">
            {formatOrderPlacedDate(order.created_at)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-0.5 text-sm font-medium">
            {formatOrderAmount(order.total_amount, order.currency)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">
            Order #{" "}
            <span className="font-medium text-foreground">{order.reference}</span>
          </p>
          <Link
            href={`/orders/${order.id}`}
            className="mt-1 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View order details
          </Link>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-5">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {statusCopy.headline}
          </h2>
          <p className="text-sm text-muted-foreground">{statusCopy.message}</p>
        </div>

        {order.preview_items.length > 0 ? (
          <ul className="mt-5 divide-y divide-border/50">
            {order.preview_items.map((item) => (
              <OrderItemPreview key={item.id} item={item} />
            ))}
          </ul>
        ) : order.item_count > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {order.item_count}{" "}
            {order.item_count === 1 ? "item" : "items"} in this order
          </p>
        ) : null}

        {hiddenItemCount > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            + {hiddenItemCount} more{" "}
            {hiddenItemCount === 1 ? "item" : "items"}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function OrderHistorySkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-xl border border-border/70 bg-card"
        >
          <div className="h-16 bg-muted/50" />
          <div className="space-y-4 px-5 py-5">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-4 w-full max-w-md rounded bg-muted" />
            <div className="flex gap-4">
              <div className="h-20 w-14 rounded-md bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrderHistoryList() {
  const [page, setPage] = useState(1);

  const query = useQuery<PaginatedResponse<OrderSummary>>({
    queryKey: ["customer-orders", page],
    queryFn: () => apiFetch(readCustomerOrders({ page, size: 10 })),
  });

  const orders = query.data?.data ?? [];
  const totalPages = query.data?.pagination?.total_pages ?? 1;

  if (query.isLoading) {
    return <OrderHistorySkeleton />;
  }

  if (query.isError) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
        Could not load your orders. Please try again.
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 px-6 py-16 text-center">
        <p className="font-display text-xl font-semibold">No orders yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          When you buy a book, it will show up here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/books">Browse books</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border/70 pt-6">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || query.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || query.isFetching}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      {query.isFetching && !query.isLoading ? (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Updating…
        </p>
      ) : null}
    </div>
  );
}
