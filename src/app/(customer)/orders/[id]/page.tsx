import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format-price";
import {
  formatOrderPlacedDate,
  getCustomerOrderStatusCopy,
} from "@/lib/customer-order-display";
import {
  type BaseResponse,
  type OrderDetail,
  type OrderDispute,
  type OrderItem,
  readOrderById,
  readOrderDisputes,
} from "@customer/api";
import { serverApiFetch } from "@/lib/api/server";
import { getAuthTokenFromRequest } from "@/lib/auth/server-cookie";
import { FulfillmentAddressPanel } from "@/components/address/fulfillment-address-panel";
import { OrderCancelButton } from "./order-cancel-button";
import { OrderDisputesPanel } from "./order-disputes-panel";
import { OrderOpenDisputeButton } from "./order-open-dispute-button";
import { OrderPaymentPanel } from "./order-payment-panel";
import { StatusBadge } from "@/components/status-badge";
import { getCustomerPaymentStatusCopy } from "@/lib/customer-order-display";

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
          <span className="text-foreground">{item.seller_name}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatPrice(Number(item.unit_price), currency)} ×{" "}
          {item.quantity}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold sm:text-right">
        {formatPrice(lineTotal(item), currency)}
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
  const paymentCopy =
    order.payment_status !== "NONE" && order.payment_status !== "PAID"
      ? getCustomerPaymentStatusCopy(order.payment_status)
      : null;

  return (
    <div className="overflow-hidden border border-border/70 bg-card shadow-sm">
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
              {paymentCopy?.message ?? statusCopy.message}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            {paymentCopy ? (
              <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:text-amber-100">
                {paymentCopy.label}
              </span>
            ) : null}
          </div>
        </div>

        <dl className="space-y-2 text-sm sm:text-right">
          <div className="flex justify-between gap-4 sm:flex-col sm:items-end">
            <dt className="text-muted-foreground">Item(s) subtotal</dt>
            <dd className="font-medium">
              {formatPrice(itemsSubtotal, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border/60 pt-2 sm:flex-col sm:items-end">
            <dt className="font-medium">Order total</dt>
            <dd className="font-display text-lg font-semibold">
              {formatPrice(Number(order.total_amount), order.currency)}
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
  let disputes: OrderDispute[] = [];
  try {
    const [orderRes, disputesRes] = await Promise.all([
      serverApiFetch<BaseResponse<OrderDetail>>(readOrderById(id)),
      serverApiFetch<BaseResponse<OrderDispute[]>>(readOrderDisputes(id)),
    ]);
    if (!orderRes.data) notFound();
    order = orderRes.data;
    disputes = disputesRes.data ?? [];
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

          <Suspense fallback={null}>
            <OrderPaymentPanel
              orderId={order.id}
              paymentStatus={order.payment_status ?? "NONE"}
              totalAmount={Number(order.total_amount)}
              currency={order.currency}
            />
          </Suspense>

          {order.seller_orders?.[0]?.fulfillment_address ? (
            <FulfillmentAddressPanel
              address={order.seller_orders[0].fulfillment_address}
            />
          ) : null}

          <OrderDisputesPanel disputes={disputes} />

          {order.items.length > 0 ? (
            <section className="overflow-hidden border border-border/70 bg-card shadow-sm">
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
            <div className="flex flex-wrap gap-3">
              <OrderOpenDisputeButton
                orderId={order.id}
                canOpenDispute={Boolean(
                  order.seller_orders?.[0]?.can_open_dispute,
                )}
              />
              <OrderCancelButton
                orderId={order.id}
                status={order.status}
                paymentStatus={order.payment_status}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
