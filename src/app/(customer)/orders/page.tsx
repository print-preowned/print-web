import { OrderHistoryList } from "./order-history-list";

export default function CustomerOrdersPage() {
  return (
    <div className="storefront-grain min-h-[70vh]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <div className="space-y-2">
          <p className="text-md font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Your orders
          </p>
          <p className="text-muted-foreground">
            Track deliveries, view receipts, and pick up where you left off.
          </p>
        </div>

        <div className="mt-10">
          <OrderHistoryList />
        </div>
      </div>
    </div>
  );
}
