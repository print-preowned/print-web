import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CatalogSummaryRow = {
  label: string;
  value: ReactNode;
};

type CatalogFormShellProps = {
  children: ReactNode;
  summaryRows: CatalogSummaryRow[];
  summaryLeading?: ReactNode;
  actions: ReactNode;
  className?: string;
};

export function CatalogFormShell({
  children,
  summaryRows,
  summaryLeading,
  actions,
  className,
}: CatalogFormShellProps) {
  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start",
        className,
      )}
    >
      <div className="min-w-0 space-y-4">{children}</div>
      <aside className="lg:sticky lg:top-4">
        <div className="rounded-lg border p-4 md:p-5">
          <h3 className="mb-3 text-md font-medium">Summary</h3>
          {summaryLeading ? <div className="mb-4">{summaryLeading}</div> : null}
          <dl className="space-y-3 text-sm">
            {summaryRows.map((row) => (
              <div key={row.label} className="space-y-0.5">
                <dt className="text-muted-foreground text-xs">{row.label}</dt>
                <dd className="break-words font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-col gap-2">{actions}</div>
        </div>
      </aside>
    </div>
  );
}
