"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle, ScanBarcode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth/context";
import { scanStationKeys, sellerInventoryKeys } from "@/lib/api/query-keys";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { cn } from "@/lib/utils";
import { INVENTORY_CONDITION_VALUES } from "@/app/seller/lib/inventory-condition";
import type { PublicationLookup } from "@/app/seller/lib/api/inventory";
import {
  endScanSession,
  importScanSession,
  readScanSession,
  removeScanSessionItem,
  resolveInventoryIsbn,
  startScanSession,
  type ScanSession,
  type ScanSessionImportResult,
} from "@/app/seller/lib/api/scan-station";
import { playScanTone, scanRejectedMessage } from "@/app/seller/lib/scan-feedback";
import { useScanEvents } from "../_hooks/use-scan-events";
import { useSelectedScanStation } from "../_hooks/use-selected-scan-station";
import { scanModeFor } from "../_components/inventory/scanner-bar";
import type { BaseResponse } from "@/lib/model";

const RESOLVE_CONCURRENCY = 4;

type RowOverride = {
  price?: string;
  stock?: string;
  condition?: string;
};

type Lookup =
  | { status: "loading" }
  | { status: "found"; title: string | null; image: string | null }
  | { status: "missing" };

export default function ScanBatchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session: auth } = useAuth();
  const { stations, station, stationId, isLoading } = useSelectedScanStation();
  const [session, setSession] = useState<ScanSession | null>(null);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<string>(INVENTORY_CONDITION_VALUES[0] ?? "Good");
  const [overrides, setOverrides] = useState<Record<string, RowOverride>>({});
  const [lookups, setLookups] = useState<Record<string, Lookup>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const { mutateAsync, isPending } = useApiMutation<
    BaseResponse<ScanSession | ScanSessionImportResult[]> | void
  >();

  const batching = scanModeFor(station, auth?.id) === "batch";
  const items = useMemo(() => session?.items ?? [], [session]);

  const refreshSession = useCallback(async (id: string) => {
    try {
      const { data } = await apiFetch<BaseResponse<ScanSession>>(readScanSession(id), {
        silentStatuses: [404],
      });
      setSession(data);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    if (!stationId || !batching) {
      setSession(null);
      return;
    }
    void refreshSession(stationId);
  }, [stationId, batching, refreshSession]);

  useScanEvents(
    stationId,
    (event) => {
      if (event.type === "session_item" && event.isbn) {
        const isbn = event.isbn;
        playScanTone("ok");
        setLastScanned(isbn);
        setSession((prev) => {
          if (!prev) return prev;
          const quantity = event.quantity ?? 1;
          const exists = prev.items.some((item) => item.isbn === isbn);
          return {
            ...prev,
            items: exists
              ? prev.items.map((item) => (item.isbn === isbn ? { ...item, quantity } : item))
              : [...prev.items, { isbn, quantity }],
            count: event.count ?? prev.count + 1,
          };
        });
        return;
      }
      if (event.type === "session_item_removed" && event.isbn) {
        const isbn = event.isbn;
        setSession((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((item) => item.isbn !== isbn),
                count: event.count ?? prev.count,
              }
            : prev,
        );
        return;
      }
      if (event.type === "scan_rejected") {
        playScanTone("error");
        toast.error(scanRejectedMessage(event), { id: "scan-rejected" });
      }
    },
    Boolean(stationId && session),
    "station",
  );

  // Look up titles as scans arrive, a few at a time.
  const inflight = useRef(0);
  useEffect(() => {
    const todo = items
      .map((item) => item.isbn)
      .filter((isbn) => !lookups[isbn])
      .slice(0, Math.max(0, RESOLVE_CONCURRENCY - inflight.current));
    if (todo.length === 0) return;
    setLookups((prev) => {
      const next = { ...prev };
      for (const isbn of todo) next[isbn] = { status: "loading" };
      return next;
    });
    for (const isbn of todo) {
      inflight.current += 1;
      const call = resolveInventoryIsbn(isbn);
      void apiFetch<PublicationLookup | null>(call.endpoint, {
        method: call.method,
        body: call.body,
        silentStatuses: [404],
      })
        .then((result): Lookup =>
          result
            ? { status: "found", title: result.title, image: result.images[0] ?? null }
            : { status: "missing" },
        )
        .catch((): Lookup => ({ status: "missing" }))
        .then((lookup) => {
          inflight.current -= 1;
          setLookups((prev) => ({ ...prev, [isbn]: lookup }));
        });
    }
  }, [items, lookups]);

  function effectiveRow(isbn: string, quantity: number) {
    const override = overrides[isbn] ?? {};
    return {
      price: override.price ?? price,
      stock: override.stock ?? String(quantity),
      condition: override.condition ?? condition,
    };
  }

  function updateRow(isbn: string, patch: RowOverride) {
    setOverrides((prev) => ({ ...prev, [isbn]: { ...prev[isbn], ...patch } }));
    setRowErrors((prev) => {
      if (!prev[isbn]) return prev;
      const next = { ...prev };
      delete next[isbn];
      return next;
    });
  }

  async function startBatch() {
    if (!stationId) return;
    try {
      const started = (await mutateAsync(startScanSession(stationId)))?.data as ScanSession;
      setSession(started);
      await queryClient.invalidateQueries({ queryKey: scanStationKeys.all });
    } catch {
      // toasted
    }
  }

  async function removeRow(isbn: string) {
    if (!stationId) return;
    try {
      const updated = (await mutateAsync(removeScanSessionItem(stationId, isbn)))
        ?.data as ScanSession;
      setSession(updated);
    } catch {
      // toasted
    }
  }

  async function endBatch() {
    if (!stationId) return;
    try {
      await mutateAsync(endScanSession(stationId));
      await queryClient.invalidateQueries({ queryKey: scanStationKeys.all });
      router.push("/seller/inventory");
    } catch {
      // toasted
    }
  }

  // A blank price is fine (the book is saved as a draft); a typed one must be valid.
  const badPrice = items.filter((item) => {
    const value = effectiveRow(item.isbn, item.quantity).price.trim();
    return value !== "" && !(Number(value) > 0);
  });
  const unpriced = items.filter(
    (item) => effectiveRow(item.isbn, item.quantity).price.trim() === "",
  );

  async function importAll() {
    if (!stationId || items.length === 0) return;
    setAttempted(true);
    if (badPrice.length > 0) {
      toast.error(
        `${badPrice.length} price${badPrice.length === 1 ? " isn't" : "s aren't"} a valid amount`,
      );
      return;
    }
    const payload = items.map((item) => {
      const row = effectiveRow(item.isbn, item.quantity);
      return {
        isbn: item.isbn,
        offer: {
          price: row.price.trim() || undefined,
          stock: Number(row.stock) || 0,
          condition: row.condition,
          signed: false,
        },
      };
    });
    try {
      const results = (await mutateAsync(importScanSession(stationId, { items: payload })))
        ?.data as ScanSessionImportResult[];
      const failed = results.filter((row) => !row.inventory_id);
      const created = results.length - failed.length;
      setRowErrors(
        Object.fromEntries(failed.map((row) => [row.isbn, row.error || "Could not add"])),
      );
      setAttempted(false);
      if (created > 0) {
        const drafts = results.filter((row) => row.status === "DRAFT").length;
        toast.success(`Added ${created} book${created === 1 ? "" : "s"} to inventory`, {
          description:
            drafts > 0
              ? `${drafts} saved as draft${drafts === 1 ? "" : "s"} — price them in Inventory to publish.`
              : undefined,
        });
        void queryClient.invalidateQueries({ queryKey: sellerInventoryKeys.all });
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} couldn't be added — see the highlighted rows`);
      }
      await refreshSession(stationId);
    } catch {
      // toasted
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoaderCircle className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (stations.length === 0 || !station) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 p-4">
        <h1 className="text-xl font-semibold">Scan batch</h1>
        <p className="text-muted-foreground text-sm">
          You don&apos;t have a scanner yet.{" "}
          <Link href="/seller/inventory" className="underline">
            Set one up from your inventory
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!batching) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="text-xl font-semibold">Scan batch</h1>
        <div className="space-y-3 rounded-lg border border-dashed p-6 text-center">
          <ScanBarcode className="text-muted-foreground mx-auto size-8" />
          <p className="text-sm">
            Scan a stack of books with <span className="font-medium">{station.label}</span>,
            then price them all at once.
          </p>
          <Button type="button" onClick={() => void startBatch()} disabled={isPending}>
            Start a batch
          </Button>
        </div>
      </div>
    );
  }

  const rows = [...items].reverse();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Scan batch</h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className="inline-block size-2 animate-pulse rounded-full bg-blue-500" />
            Scanning with {station.label} — {session?.count ?? 0} book
            {session?.count === 1 ? "" : "s"} queued
          </p>
        </div>
        {items.length === 0 ? (
          <Button type="button" variant="outline" onClick={() => void endBatch()} disabled={isPending}>
            Done
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDiscard(true)}
            disabled={isPending}
          >
            Discard batch
          </Button>
        )}
      </div>

      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="batch-price">Price for every book</Label>
          <Input
            id="batch-price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
            placeholder="e.g. 2500"
          />
        </div>
        <div className="space-y-2">
          <Label>Condition for every book</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_CONDITION_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-sm sm:col-span-2">
          Change any row below to override it. Stock starts at the number of copies scanned.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6">
          <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
          <p className="text-sm">Waiting for scans… scan the barcode on the back of each book.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-2 font-medium">Book</th>
                <th className="py-2 pr-2 font-medium">Price</th>
                <th className="py-2 pr-2 font-medium">Stock</th>
                <th className="py-2 pr-2 font-medium">Condition</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const row = effectiveRow(item.isbn, item.quantity);
                const override = overrides[item.isbn] ?? {};
                const lookup = lookups[item.isbn];
                const error = rowErrors[item.isbn];
                const needsPrice =
                  attempted && badPrice.some((invalid) => invalid.isbn === item.isbn);
                return (
                  <tr
                    key={item.isbn}
                    className={cn(
                      "border-b align-top transition-colors",
                      item.isbn === lastScanned && "bg-blue-500/5",
                      error && "bg-destructive/5",
                    )}
                  >
                    <td className="py-2 pr-2">
                      <div className="flex gap-3">
                        {lookup?.status === "found" && lookup.image ? (
                          <img src={lookup.image} alt="" className="h-12 w-8 rounded object-cover" />
                        ) : (
                          <div className="bg-muted h-12 w-8 rounded" />
                        )}
                        <div className="min-w-0 max-w-[16rem]">
                          <p className="truncate">
                            {!lookup || lookup.status === "loading" ? (
                              <span className="text-muted-foreground">Looking up…</span>
                            ) : lookup.status === "found" ? (
                              lookup.title || "Untitled"
                            ) : (
                              <span className="text-amber-600">Not found in catalog</span>
                            )}
                          </p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {item.isbn}
                            {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                          </p>
                          {error ? <p className="text-destructive text-xs">{error}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={row.price}
                        onChange={(event) => updateRow(item.isbn, { price: event.target.value })}
                        inputMode="decimal"
                        placeholder="Price"
                        aria-invalid={needsPrice}
                        className={cn(
                          "h-8 w-24",
                          override.price === undefined && "text-muted-foreground",
                        )}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={row.stock}
                        onChange={(event) => updateRow(item.isbn, { stock: event.target.value })}
                        inputMode="numeric"
                        className={cn(
                          "h-8 w-16",
                          override.stock === undefined && "text-muted-foreground",
                        )}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Select
                        value={row.condition}
                        onValueChange={(value) => updateRow(item.isbn, { condition: value })}
                      >
                        <SelectTrigger
                          data-size="sm"
                          className={cn(
                            "w-32",
                            override.condition === undefined && "text-muted-foreground",
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVENTORY_CONDITION_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => void removeRow(item.isbn)}
                        disabled={isPending}
                        aria-label={`Remove ${item.isbn}`}
                      >
                        <X className="size-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void importAll()} disabled={isPending}>
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            Add {rows.length} book{rows.length === 1 ? "" : "s"} to inventory
          </Button>
          {unpriced.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              {unpriced.length} without a price will be saved as draft
              {unpriced.length === 1 ? "" : "s"}, not for sale until priced.
            </p>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard this batch?"
        description={`${session?.count ?? 0} scanned book${session?.count === 1 ? "" : "s"} will be thrown away without being added to inventory.`}
        confirmLabel="Discard"
        confirmVariant="destructive"
        confirmPending={isPending}
        onConfirm={() => {
          setConfirmDiscard(false);
          void endBatch();
        }}
      />
    </div>
  );
}
