"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScanBarcode, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth/context";
import { scanStationKeys } from "@/lib/api/query-keys";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { cn } from "@/lib/utils";
import {
  claimScanStation,
  endScanSession,
  readScanSession,
  releaseScanStationClaim,
  startScanSession,
  type ScanSession,
  type ScanStation,
} from "@/app/seller/lib/api/scan-station";
import { playScanTone, scanRejectedMessage } from "@/app/seller/lib/scan-feedback";
import type { BaseResponse } from "@/lib/model";
import { useScanEvents } from "../../_hooks/use-scan-events";
import { useSelectedScanStation } from "../../_hooks/use-selected-scan-station";
import { ScannerManageDialog } from "./scanner-manage-dialog";
import { ScannerSetupDialog } from "./scanner-setup-dialog";

export type ScanMode = "off" | "single" | "batch";

export function scanModeFor(station: ScanStation | null, userId: string | undefined): ScanMode {
  if (!station) return "off";
  if (station.active_session_id) return "batch";
  if (userId && station.claimed_by_user_id === userId) return "single";
  return "off";
}

type Props = {
  /** One-at-a-time mode: called with each scanned ISBN. */
  onScan: (isbn: string) => void;
};

export function ScannerBar({ onScan }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { stations, station, stationId, setStationId, isLoading } = useSelectedScanStation();
  const { mutateAsync, isPending } = useApiMutation<BaseResponse<unknown> | void>();
  const [setupOpen, setSetupOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  // Pending switch away from a batch that still has books queued.
  const [leaveBatch, setLeaveBatch] = useState<{ next: ScanMode; count: number } | null>(null);

  const mode = scanModeFor(station, session?.id);
  const heldByTeammate =
    mode === "off" && Boolean(station?.claimed_by_user_id) && station?.claimed_by_user_id !== session?.id;

  async function invalidateStations() {
    await queryClient.invalidateQueries({ queryKey: scanStationKeys.all });
  }

  // One-at-a-time listens to this user's channel; otherwise watch the station
  // so ignored scans and batch additions still show up here.
  const { reconnecting } = useScanEvents(
    stationId,
    (event) => {
      switch (event.type) {
        case "scan":
          if (!event.isbn) return;
          playScanTone("ok");
          onScan(event.isbn);
          return;
        case "session_item":
          playScanTone("ok");
          toast.success(
            event.added ? "Added to batch" : `Added another copy (×${event.quantity ?? 2})`,
            {
              id: "batch-scan",
              description: `${event.count ?? 0} book${event.count === 1 ? "" : "s"} in batch`,
              action: { label: "Review", onClick: () => router.push("/seller/inventory/scan") },
            },
          );
          return;
        case "scan_rejected":
          // The setup wizard reports its own test scans.
          if (setupOpen) return;
          playScanTone("error");
          toast.error(scanRejectedMessage(event), {
            id: "scan-rejected",
            action:
              event.reason === "not_listening"
                ? { label: "Turn on", onClick: () => void changeMode("single") }
                : undefined,
          });
          return;
        case "claim_lost":
          if (event.reason === "claimed") {
            toast.message("A teammate took over this scanner");
          }
          void invalidateStations();
          return;
      }
    },
    Boolean(stationId),
    mode === "single" ? "user" : "station",
  );

  async function queuedCount(id: string): Promise<number> {
    try {
      const { data } = await apiFetch<BaseResponse<ScanSession>>(readScanSession(id), {
        silentStatuses: [404],
      });
      return data.count;
    } catch {
      return 0;
    }
  }

  async function changeMode(next: ScanMode, { confirmed = false } = {}) {
    if (!station || next === mode) return;
    try {
      if (mode === "batch") {
        if (!confirmed) {
          const count = await queuedCount(station.id);
          if (count > 0) {
            setLeaveBatch({ next, count });
            return;
          }
        }
        await mutateAsync(endScanSession(station.id));
      }
      if (next === "single") {
        await mutateAsync(claimScanStation(station.id));
      } else if (next === "batch") {
        await mutateAsync(startScanSession(station.id));
      } else if (station.claimed_by_user_id === session?.id) {
        await mutateAsync(releaseScanStationClaim(station.id));
      }
      await invalidateStations();
      if (next === "batch") router.push("/seller/inventory/scan");
    } catch {
      // toasted
    }
  }

  if (isLoading) return null;

  if (stations.length === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
        <div className="flex items-center gap-3">
          <ScanBarcode className="text-muted-foreground size-5" />
          <p className="text-sm">
            Add books faster by scanning their barcodes.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setSetupOpen(true)}>
          Set up a scanner
        </Button>
        <ScannerSetupDialog
          open={setupOpen}
          onOpenChange={setSetupOpen}
          onReady={(created) => {
            setStationId(created.id);
          }}
        />
      </div>
    );
  }

  const status = (() => {
    if (mode === "single") {
      return reconnecting
        ? { tone: "warn", text: "Reconnecting… scans may be missed until this clears." }
        : { tone: "live", text: "Listening — each scan opens the add form." };
    }
    if (mode === "batch") {
      return { tone: "batch", text: "Batch in progress — scans are queued for review." };
    }
    if (heldByTeammate) {
      return { tone: "off", text: "A teammate is using this scanner. Choose a mode to take over." };
    }
    return { tone: "off", text: "Scanner off — scans are ignored." };
  })();

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ScanBarcode className="text-muted-foreground size-5 shrink-0" />
        {stations.length > 1 ? (
          <Select value={stationId ?? undefined} onValueChange={setStationId}>
            <SelectTrigger className="h-8 w-40" aria-label="Scanner">
              <SelectValue placeholder="Scanner" />
            </SelectTrigger>
            <SelectContent>
              {stations.map((row) => (
                <SelectItem key={row.id} value={row.id}>
                  {row.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm font-medium">{station?.label}</span>
        )}
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={mode}
          onValueChange={(value) => {
            if (value) void changeMode(value as ScanMode);
          }}
          disabled={isPending}
          aria-label="Scan mode"
        >
          <ToggleGroupItem value="off" className="px-3">
            Off
          </ToggleGroupItem>
          <ToggleGroupItem value="single" className="px-3">
            Single
          </ToggleGroupItem>
          <ToggleGroupItem value="batch" className="px-3">
            Batch
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="ml-auto flex gap-2">
          {mode === "batch" ? (
            <Button asChild size="sm">
              <Link href="/seller/inventory/scan">Review batch</Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setManageOpen(true)}
            aria-label="Manage scanners"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <span
          className={cn(
            "inline-block size-2 shrink-0 rounded-full",
            status.tone === "live" && "animate-pulse bg-green-500",
            status.tone === "warn" && "bg-amber-500",
            status.tone === "batch" && "bg-blue-500",
            status.tone === "off" && "bg-muted-foreground/40",
          )}
        />
        {status.text}
      </p>

      <ScannerManageDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        stations={stations}
        onAdd={() => {
          setManageOpen(false);
          setSetupOpen(true);
        }}
      />
      <ScannerSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onReady={(created) => setStationId(created.id)}
      />
      <Modal
        open={leaveBatch !== null}
        onOpenChange={(open) => {
          if (!open) setLeaveBatch(null);
        }}
        title="Discard the batch?"
        description={
          leaveBatch
            ? `${leaveBatch.count} book${leaveBatch.count === 1 ? " is" : "s are"} waiting in the batch and haven't been added to inventory.`
            : undefined
        }
        footer={
          <>
            <Button asChild variant="outline">
              <Link href="/seller/inventory/scan">Review batch</Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                const next = leaveBatch?.next;
                setLeaveBatch(null);
                if (next) void changeMode(next, { confirmed: true });
              }}
            >
              Discard and switch
            </Button>
          </>
        }
      />
    </div>
  );
}
