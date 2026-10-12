"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, LoaderCircle } from "lucide-react";
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
import { BaseResponse } from "@/app/(customer)/lib/api";

export default function BulkScanPage() {
  const [stationId, setStationId] = useState<string | null>(null);
  const [session, setSession] = useState<ScanSession | null>(null);
  const [resolved, setResolved] = useState<ScanSessionResolveItem[] | null>(null);
  const [importResults, setImportResults] = useState<ScanSessionImportResult[] | null>(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [condition, setCondition] = useState<string>(INVENTORY_CONDITION_VALUES[0] ?? "Good");
  const { mutateAsync, isPending } = useApiMutation<
    BaseResponse<ScanSession | ScanSessionResolveItem[] | ScanSessionImportResult[]> | void
  >();

  const { data: stationsData, isSuccess } = useApiQuery<{data: ScanStation[]}>(
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
    } catch {
      setSession(null);
    }
  }, []);

  useScanEvents(
    stationId,
    (event) => {
      if (event.type !== "session_item") return;
      setSession((prev) => {
        if (!prev) return prev;
        const isbns = prev.isbns.includes(event.isbn)
          ? prev.isbns
          : [...prev.isbns, event.isbn];
        return {
          ...prev,
          isbns,
          count: event.count ?? isbns.length,
        };
      });
      setResolved(null);
      setImportResults(null);
    },
    Boolean(stationId && session),
  );

  async function start() {
    if (!stationId) return;
    try {
      const started = (await mutateAsync(startScanSession(stationId)))?.data as ScanSession;
      setSession(started);
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
      const items = (await mutateAsync(resolveScanSession(stationId)))?.data as ScanSessionResolveItem[];
      setResolved(items);
      toast.success(`Resolved ${items.filter((item) => item.found).length} of ${items.length}`);
    } catch {
      // toasted
    }
  }

  async function importAll() {
    if (!stationId) return;
    if (!price.trim() || Number(price) <= 0) {
      toast.error("Enter a price greater than zero");
      return;
    }
    try {
      const results = (await mutateAsync(
        importScanSession(stationId, {
          offer: {
            price: price.trim(),
            stock: Number(stock) || 0,
            condition,
            signed: false,
          },
        }),
      ))?.data as ScanSessionImportResult[];
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
console.log(11111, session)
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/seller/inventory">
            <ArrowLeft className="size-4" />
            Inventory
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Bulk scan session</h1>
          <p className="text-muted-foreground text-sm">
            Start a session so the station webhook queues ISBNs instead of driving the single-offer form.
          </p>
        </div>
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

          <ul className="max-h-64 space-y-1 overflow-y-auto font-mono text-sm">
            {session.isbns.map((isbn) => (
              <li key={isbn}>{isbn}</li>
            ))}
            {session.isbns.length === 0 ? (
              <li className="text-muted-foreground font-sans">Waiting for scans…</li>
            ) : null}
          </ul>

          {resolved ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Resolve results</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                {resolved.map((item) => (
                  <li key={item.isbn}>
                    <span className="font-mono">{item.isbn}</span>
                    {" — "}
                    {item.found ? item.title || "Found" : "Not in catalog / OL"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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
              <Label>Condition</Label>
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
          Create a station on the inventory page, then start a session here before scanning in bulk.
        </p>
      )}
    </div>
  );
}
