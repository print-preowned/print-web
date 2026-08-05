import { formatAddressLine } from "@/lib/api/address";
import type { OrderFulfillmentAddress } from "@/lib/api/order";

type FulfillmentAddressPanelProps = {
  address: OrderFulfillmentAddress;
  title?: string;
};

export function FulfillmentAddressPanel({
  address,
  title,
}: FulfillmentAddressPanelProps) {
  const resolvedTitle =
    title ??
    (address.fulfillment_type === "PICKUP" ? "Pick up at" : "Ship to");
  const label = address.address_label?.trim();
  const headline = label || address.recipient_name;

  return (
    <section className="overflow-hidden border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 px-4 py-3 sm:px-5">
        <h2 className="font-display text-lg font-semibold">{resolvedTitle}</h2>
      </div>
      <div className="space-y-1 px-4 py-4 text-sm sm:px-5">
        <p className="font-medium">{headline}</p>
        {label && address.recipient_name ? (
          <p className="text-muted-foreground">{address.recipient_name}</p>
        ) : null}
        <p className="text-muted-foreground">
          {formatAddressLine(address)}
          {address.country_code && address.country_code !== "NG"
            ? `, ${address.country_code}`
            : ""}
        </p>
        {address.phone_number ? (
          <p className="text-muted-foreground">{address.phone_number}</p>
        ) : null}
      </div>
    </section>
  );
}
