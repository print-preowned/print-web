"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { scanStationKeys } from "@/lib/api/query-keys";
import {
  claimScanStation,
  createScanStation,
  deleteScanStation,
  listScanStations,
  rotateScanStationToken,
  type ScanStation,
} from "@/app/seller/lib/api/scan-station";

type Props = {
  selectedStationId: string | null;
  onSelectStation: (stationId: string | null) => void;
};

export function ScanStationPanel({ selectedStationId, onSelectStation }: Props) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("Counter 1");
  const [revealedUrl, setRevealedUrl] = useState<string | null>(null);
  const { mutateAsync, isPending } = useApiMutation<ScanStation>();

  const stationsQuery = useApiQuery<ScanStation[]>(
    scanStationKeys.all,
    listScanStations(),
  );
  const stations = stationsQuery.data ?? [];

  useEffect(() => {
    if (!stationsQuery.isSuccess) return;
    if (selectedStationId && !stations.some((row) => row.id === selectedStationId)) {
      onSelectStation(stations[0]?.id ?? null);
    } else if (!selectedStationId && stations[0]) {
      onSelectStation(stations[0].id);
    }
  }, [stationsQuery.isSuccess, stations, selectedStationId, onSelectStation]);

  async function invalidateStations() {
    await queryClient.invalidateQueries({ queryKey: scanStationKeys.all });
  }

  async function createStation() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Enter a station label");
      return;
    }
    try {
      const created = await mutateAsync(createScanStation(trimmed));
      setRevealedUrl(created.webhook_url ?? null);
      toast.success("Scanner station created — copy the webhook URL now");
      await invalidateStations();
      onSelectStation(created.id);
    } catch {
      // toasted
    }
  }

  async function rotate(stationId: string) {
    try {
      const rotated = await mutateAsync(rotateScanStationToken(stationId));
      setRevealedUrl(rotated.webhook_url ?? null);
      toast.success("New webhook URL issued — update the scanner");
      await invalidateStations();
    } catch {
      // toasted
    }
  }

  async function claim(stationId: string) {
    try {
      await mutateAsync(claimScanStation(stationId));
      toast.success("Station claimed for this session");
      await invalidateStations();
    } catch {
      // toasted
    }
  }

  async function remove(stationId: string) {
    try {
      await mutateAsync(deleteScanStation(stationId));
      toast.success("Station removed");
      setRevealedUrl(null);
      await invalidateStations();
    } catch {
      // toasted
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Webhook URL copied");
    } catch {
      toast.error("Could not copy URL");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Barcode scanner</h3>
          <p className="text-muted-foreground text-sm">
            One webhook URL per station. Paste it into the scanner; scans fill the ISBN field here.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/seller/inventory/scan">Bulk scan session</Link>
        </Button>
      </div>

      {stationsQuery.isLoading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label>Active station</Label>
            <Select
              value={selectedStationId ?? undefined}
              onValueChange={(value) => onSelectStation(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.label}
                    {station.active_session_id ? " (bulk session)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedStationId ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void claim(selectedStationId)}
                  disabled={isPending}
                >
                  Claim
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void rotate(selectedStationId)}
                  disabled={isPending}
                >
                  <RefreshCw className="size-4" />
                  Rotate URL
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void remove(selectedStationId)}
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="station-label">New station</Label>
          <Input
            id="station-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Counter 1"
          />
        </div>
        <Button type="button" onClick={() => void createStation()} disabled={isPending}>
          <Plus className="size-4" />
          Create
        </Button>
      </div>

      {revealedUrl ? (
        <div className="space-y-2 rounded-md bg-muted p-3">
          <p className="text-sm font-medium">Webhook URL (shown once)</p>
          <div className="flex gap-2">
            <Input readOnly value={revealedUrl} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={() => void copyUrl(revealedUrl)}>
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
