import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { fetchOrderById, formatPrice } from "@customer/api";
import { getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

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

  let order;
  try {
    const res = await fetchOrderById(id, token);
    order = res.data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
      notFound();
    }
    throw err;
  }

  if (!order) notFound();

  return (
    <div className="storefront-grain min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Order placed
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Thanks for your order
        </h1>
        <p className="mt-3 text-muted-foreground">
          We’ve recorded your purchase. Keep this reference for your records.
        </p>

        <dl className="mt-10 space-y-4 border-y border-border/70 py-8">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="font-medium">{order.reference}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{order.status}</dd>
          </div>
        </dl>

        {order.items.length > 0 && (
          <ul className="divide-y divide-border/70 border-b border-border/70">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-4 py-4"
              >
                <div>
                  <p className="font-medium">Item</p>
                  <p className="text-sm text-muted-foreground">
                    Qty {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium">
                  {formatPrice(Number(item.unit_price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-6 space-y-4">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-display text-lg font-semibold">
              {formatPrice(Number(order.total_amount))}
            </dd>
          </div>
        </dl>

        <Link
          href="/books"
          className="mt-8 inline-flex text-sm font-semibold underline-offset-4 hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
