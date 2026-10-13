"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { scanStationKeys } from "@/lib/api/query-keys";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { INVENTORY_CONDITION_VALUES } from "@/app/seller/lib/inventory-condition";
import {
  endScanSession,
  importScanSession,
  listScanStations,
  readScanSession,
  resolveScanSession,
  startScanSession,
  type ScanSession,
  type ScanSessionImportResult,
  type ScanSessionResolveItem,
  type ScanStation,
} from "@/app/seller/lib/api/scan-station";
import { useScanEvents } from "../_hooks/use-scan-events";
import type { BaseResponse } from "@/lib/model";

type RowOffer = {
  price: string;
  stock: string;
  condition: string;
};

function seedRow(defaults: RowOffer): RowOffer {
  return {
    price: defaults.price,
    stock: defaults.stock,
    condition: defaults.condition,
  };
}

function syncRowsToIsbns(
  isbns: string[],
  prev: Record<string, RowOffer>,
  defaults: RowOffer,
): Record<string, RowOffer> {
  const next: Record<string, RowOffer> = {};
  for (const isbn of isbns) {
    next[isbn] = prev[isbn] ?? seedRow(defaults);
  }
  return next;
}

export default function BulkScanPage() {
  const [stationId, setStationId] = useState<string | null>(null);
  const [session, setSession] = useState<ScanSession | null>(null);
  const [resolved, setResolved] = useState<ScanSessionResolveItem[] | null>(null);
  const [importResults, setImportResults] = useState<ScanSessionImportResult[] | null>(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [condition, setCondition] = useState<string>(INVENTORY_CONDITION_VALUES[0] ?? "Good");
  const [rows, setRows] = useState<Record<string, RowOffer>>({});
  const { mutateAsync, isPending } = useApiMutation<
    BaseResponse<ScanSession | ScanSessionResolveItem[] | ScanSessionImportResult[]> | void
  >();

  const defaults: RowOffer = { price, stock, condition };
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const { data: stationsData, isSuccess } = useApiQuery<BaseResponse<ScanStation[]>>(
    scanStationKeys.all,
    listScanStations(),
  );
  const stations = stationsData?.data ?? [];

  useEffect(() => {
    if (!isSuccess || stationId) return;
    if (stations[0]) setStationId(stations[0].id);
  }, [isSuccess, stations, stationId]);

  const refreshSession = useCallback(async (id: string) => {
    try {
      const { data: current } = await apiFetch<BaseResponse<ScanSession>>(readScanSession(id), {
        silentStatuses: [404],
      });
      setSession(current);
      setRows((prev) => syncRowsToIsbns(current.isbns, prev, defaultsRef.current));
    } catch {
      setSession(null);
      setRows({});
    }
  }, []);

  const { reconnecting } = useScanEvents(
    stationId,
    (event) => {
      if (event.type !== "session_item" || !event.isbn) return;
      const isbn = event.isbn;
      setSession((prev) => {
        if (!prev) return prev;
        const isbns = prev.isbns.includes(isbn) ? prev.isbns : [...prev.isbns, isbn];
        return {
          ...prev,
          isbns,
          count: event.count ?? isbns.length,
        };
      });
      setRows((prev) => {
        if (prev[isbn]) return prev;
        return { ...prev, [isbn]: seedRow(defaultsRef.current) };
      });
      setResolved(null);
      setImportResults(null);
    },
    Boolean(stationId && session),
    "station",
  );

  async function start() {
    if (!stationId) return;
    try {
      const started = (await mutateAsync(startScanSession(stationId)))?.data as ScanSession;
      setSession(started);
      setRows(syncRowsToIsbns(started.isbns, {}, defaults));
      setResolved(null);
      setImportResults(null);
      toast.success("Bulk scan session started — scans append to the queue");
    } catch {
      // toasted
    }
  }

  async function end() {
    if (!stationId) return;
    try {
      await mutateAsync(endScanSession(stationId));
      setSession(null);
      setRows({});
      setResolved(null);
      setImportResults(null);
      toast.success("Scan session ended");
    } catch {
      // toasted
    }
  }

  async function resolveAll() {
    if (!stationId) return;
    try {
      const items = (await mutateAsync(resolveScanSession(stationId)))
        ?.data as ScanSessionResolveItem[];
      setResolved(items);
      toast.success(`Resolved ${items.filter((item) => item.found).length} of ${items.length}`);
    } catch {
      // toasted
    }
  }

  function applyDefaultsToAll() {
    if (!session) return;
    setRows((prev) => {
      const next: Record<string, RowOffer> = {};
      for (const isbn of session.isbns) {
        next[isbn] = seedRow(defaults);
      }
      // Preserve any keys that somehow exist; overwrite session ISBNs.
      return { ...prev, ...next };
    });
    toast.success("Defaults applied to all rows");
  }

  function updateRow(isbn: string, patch: Partial<RowOffer>) {
    setRows((prev) => {
      const current = prev[isbn] ?? seedRow(defaults);
      return { ...prev, [isbn]: { ...current, ...patch } };
    });
  }

  async function importAll() {
    if (!stationId || !session) return;
    const items = session.isbns.map((isbn) => {
      const row = rows[isbn] ?? seedRow(defaults);
      return {
        isbn,
        offer: {
          price: row.price.trim(),
          stock: Number(row.stock) || 0,
          condition: row.condition,
          signed: false,
        },
      };
    });
    const bad = items.find((item) => !item.offer.price || Number(item.offer.price) <= 0);
    if (bad) {
      toast.error(`Enter a price greater than zero for ${bad.isbn}`);
      return;
    }
    try {
      const results = (
        await mutateAsync(importScanSession(stationId, { items }))
      )?.data as ScanSessionImportResult[];
      setImportResults(results);
      const ok = results.filter((row) => row.inventory_id).length;
      toast.success(`Created ${ok} of ${results.length} offers`);
      await refreshSession(stationId);
    } catch {
      // toasted
    }
  }

  useEffect(() => {
    if (!stationId) return;
    void refreshSession(stationId);
  }, [stationId, refreshSession]);

  const titleByIsbn = new Map((resolved ?? []).map((item) => [item.isbn, item]));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-xl font-semibold">Bulk scan session</h1>
        <p className="text-muted-foreground text-sm">
          Start a session so the station webhook queues ISBNs instead of driving the
          single-offer form.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-2">
          <Label>Station</Label>
          <Select
            value={stationId ?? undefined}
            onValueChange={(value) => setStationId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a station" />
            </SelectTrigger>
            <SelectContent>
              {stations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          {!session ? (
            <Button type="button" onClick={() => void start()} disabled={!stationId || isPending}>
              Start session
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => void end()} disabled={isPending}>
              End session
            </Button>
          )}
        </div>
      </div>

      {session ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              Queue: <span className="font-medium">{session.count}</span> ISBN
              {session.count === 1 ? "" : "s"}
              {reconnecting ? (
                <span className="text-muted-foreground">
                  {" "}
                  — Reconnecting… scans may be missed until this clears.
                </span>
              ) : null}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void resolveAll()}
                disabled={isPending || session.count === 0}
              >
                {isPending ? <LoaderCircle className="animate-spin" /> : null}
                Resolve all
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-price">Default price</Label>
              <Input
                id="bulk-price"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-stock">Default stock</Label>
              <Input
                id="bulk-stock"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>Default condition</Label>
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
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyDefaultsToAll}
              disabled={session.count === 0}
            >
              Apply defaults to all
            </Button>
          </div>

          {session.isbns.length === 0 ? (
            <p className="text-muted-foreground text-sm">Waiting for scans…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-2 font-medium">ISBN</th>
                    <th className="py-2 pr-2 font-medium">Title</th>
                    <th className="py-2 pr-2 font-medium">Price</th>
                    <th className="py-2 pr-2 font-medium">Stock</th>
                    <th className="py-2 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {session.isbns.map((isbn) => {
                    const row = rows[isbn] ?? seedRow(defaults);
                    const resolvedRow = titleByIsbn.get(isbn);
                    return (
                      <tr key={isbn} className="border-b align-top">
                        <td className="py-2 pr-2 font-mono text-xs">{isbn}</td>
                        <td className="text-muted-foreground max-w-[12rem] py-2 pr-2">
                          {resolvedRow
                            ? resolvedRow.found
                              ? resolvedRow.title || "Found"
                              : "Not in catalog / OL"
                            : "—"}
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            value={row.price}
                            onChange={(event) =>
                              updateRow(isbn, { price: event.target.value })
                            }
                            inputMode="decimal"
                            className="h-8 w-24"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            value={row.stock}
                            onChange={(event) =>
                              updateRow(isbn, { stock: event.target.value })
                            }
                            inputMode="numeric"
                            className="h-8 w-16"
                          />
                        </td>
                        <td className="py-2">
                          <Select
                            value={row.condition}
                            onValueChange={(value) =>
                              updateRow(isbn, { condition: value })
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Button
            type="button"
            onClick={() => void importAll()}
            disabled={isPending || session.count === 0}
          >
            Import offers
          </Button>

          {importResults ? (
            <ul className="space-y-1 text-sm">
              {importResults.map((row) => (
                <li key={row.isbn}>
                  <span className="font-mono">{row.isbn}</span>
                  {" — "}
                  {row.inventory_id ? "Created" : row.error || "Failed"}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Create a station on the inventory page, then start a session here before scanning
          in bulk.
        </p>
      )}
    </div>
  );
}
