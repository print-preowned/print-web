"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InventoryOnboardForm } from "../_components/inventory/inventory-onboard-form";
import { ScannerBar } from "../_components/inventory/scanner-bar";

function AddToInventory() {
  const router = useRouter();
  const pathname = usePathname();
  const isbn = useSearchParams().get("isbn");
  // Remounting the form starts it fresh, and re-runs the lookup even when the
  // same ISBN is scanned again.
  const [formKey, setFormKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [pendingScan, setPendingScan] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  // Books scanned in one sitting are usually in similar shape, so carry the
  // last condition over instead of making the seller pick it every time.
  const [lastCondition, setLastCondition] = useState("");

  function startOver(nextIsbn: string | null) {
    setDirty(false);
    setFormKey((key) => key + 1);
    router.replace(nextIsbn ? `${pathname}?isbn=${encodeURIComponent(nextIsbn)}` : pathname);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Add to inventory</h1>
        <p className="text-muted-foreground text-sm">
          Look up by ISBN or search the catalog by title, then set price and stock.
          With the scanner on Single, each scan loads here.
        </p>
      </div>

      <ScannerBar
        onScan={(scanned) => {
          if (dirty) setPendingScan(scanned);
          else startOver(scanned);
        }}
      />

      {added.length > 0 ? (
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              Added {added.length} book{added.length === 1 ? "" : "s"}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/seller/inventory">View inventory</Link>
            </Button>
          </div>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {added.slice(0, 5).map((title, index) => (
              <li key={`${index}-${title}`} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-green-600" />
                <span className="truncate">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className="rounded-lg border p-4"
        onChangeCapture={() => setDirty(true)}
      >
        <InventoryOnboardForm
          key={formKey}
          initialIsbn={isbn}
          defaultCondition={lastCondition}
          onSuccess={({ title, condition }) => {
            setAdded((current) => [title, ...current]);
            setLastCondition(condition);
            startOver(null);
          }}
        />
      </div>

      <Modal
        open={pendingScan !== null}
        onOpenChange={(open) => {
          if (!open) setPendingScan(null);
        }}
        title="Replace with the scanned book?"
        description="You've started filling in this book. Switching to the new scan clears what you entered."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setPendingScan(null)}>
              Keep editing
            </Button>
            <Button
              type="button"
              onClick={() => {
                const next = pendingScan;
                setPendingScan(null);
                startOver(next);
              }}
            >
              Use new scan
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function AddToInventoryPage() {
  return (
    <Suspense>
      <AddToInventory />
    </Suspense>
  );
}
