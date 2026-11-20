import { OrdersTable } from "./orders-table";

export default function OrdersPage() {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">
        Orders that include items from your inventory. Update fulfillment status
        as you confirm, ship, and deliver.
      </p>
      <OrdersTable />
    </div>
  );
}
