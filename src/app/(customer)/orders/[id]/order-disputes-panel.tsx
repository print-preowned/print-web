import { StatusBadge } from "@/components/status-badge";
import type { OrderDispute, SellerOrder } from "@customer/api";
import { formatOrderPlacedDate } from "@/lib/customer-order-display";

type Props = {
  disputes: OrderDispute[];
  sellerOrders?: SellerOrder[];
};

export function OrderDisputesPanel({ disputes, sellerOrders }: Props) {
  if (disputes.length === 0) {
    return null;
  }

  const sellerNameById = new Map(
    (sellerOrders ?? []).map((child) => [child.id, child.seller_name]),
  );

  return (
    <section className="overflow-hidden border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 px-4 py-3 sm:px-5">
        <h2 className="font-display text-lg font-semibold">Disputes</h2>
      </div>
      <ul className="divide-y divide-border/60">
        {disputes.map((dispute) => {
          const sellerName = sellerNameById.get(dispute.seller_order_id);
          return (
            <li key={dispute.id} className="space-y-2 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={dispute.dispute_status} />
                {sellerName ? (
                  <span className="text-sm font-medium">{sellerName}</span>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  Opened {formatOrderPlacedDate(dispute.created_at)}
                </span>
                {dispute.resolved_at ? (
                  <span className="text-xs text-muted-foreground">
                    · Resolved {formatOrderPlacedDate(dispute.resolved_at)}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {dispute.reason}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
