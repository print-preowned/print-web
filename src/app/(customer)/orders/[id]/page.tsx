import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { formatOrderAmount } from "@/lib/api/order";
import {
  formatOrderPlacedDate,
  getCustomerOrderStatusCopy,
} from "@/lib/customer-order-display";
import { fetchOrderById, OrderDetail, OrderItem } from "@customer/api";
import { getAuthTokenFromRequest } from "@/lib/auth/server-cookie";
import { StatusBadge } from "@/components/status-badge";
import { OrderCancelButton } from "./order-cancel-button";

function lineTotal(item: OrderItem): number {
  return Number(item.unit_price) * item.quantity;
}

function OrderLineItem({
  item,
  currency,
}: {
  item: OrderItem;
  currency: string;
}) {
  return (
    <li className="flex flex-col gap-4 border-b border-border/60 py-6 last:border-b-0 sm:flex-row sm:items-start">
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
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
        <Link
          href={`/books/${item.book_id}`}
          className="font-medium leading-snug text-primary underline-offset-4 hover:underline"
        >
          {item.book_title}
        </Link>
        {item.author_names.length > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {item.author_names.join(", ")}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          Sold by{" "}
          <span className="text-foreground">{item.business_name}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
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

function OrderSummaryPanel({ order }: { order: OrderDetail }) {
  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + lineTotal(item),
    0,
  );
  const statusCopy = getCustomerOrderStatusCopy(order.status);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="grid gap-6 border-b border-border/60 bg-muted/40 px-4 py-4 sm:grid-cols-2 sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Order placed
          </p>
          <p className="mt-0.5 text-sm font-medium">
            {formatOrderPlacedDate(order.created_at)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">
            Order #{" "}
            <span className="font-medium text-foreground">{order.reference}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 px-4 py-5 sm:grid-cols-2 sm:px-5">
        <div className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {statusCopy.headline}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusCopy.message}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <dl className="space-y-2 text-sm sm:text-right">
          <div className="flex justify-between gap-4 sm:flex-col sm:items-end">
            <dt className="text-muted-foreground">Item(s) subtotal</dt>
            <dd className="font-medium">
              {formatOrderAmount(itemsSubtotal, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border/60 pt-2 sm:flex-col sm:items-end">
            <dt className="font-medium">Order total</dt>
            <dd className="font-display text-lg font-semibold">
              {formatOrderAmount(Number(order.total_amount), order.currency)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getAuthTokenFromRequest();
  if (!token) {
    redirect(`/login?redirect=/orders/${id}`);
  }

  let order: OrderDetail;
  try {
    const res = await fetchOrderById(id, token);
    if (!res.data) notFound();
    order = res.data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="storefront-grain min-h-[70vh]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <Link
          href="/orders"
          className="text-sm font-medium text-muted-foreground hover:underline"
        >
          ← Your orders
        </Link>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Order details
        </h1>

        <div className="mt-8 space-y-6">
          <OrderSummaryPanel order={order} />

          {order.items.length > 0 ? (
            <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
              <div className="border-b border-border/60 px-4 py-3 sm:px-5">
                <h2 className="font-display text-lg font-semibold">
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "item" : "items"} in this order
                </h2>
              </div>
              <ul className="px-4 sm:px-5">
                {order.items.map((item) => (
                  <OrderLineItem
                    key={item.id}
                    item={item}
                    currency={order.currency}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-col items-start gap-4 border-t border-border/70 pt-6">
            <Link
              href="/books"
              className="inline-flex text-sm font-semibold underline-offset-4 hover:underline"
            >
              Continue shopping
            </Link>
            <OrderCancelButton orderId={order.id} status={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
