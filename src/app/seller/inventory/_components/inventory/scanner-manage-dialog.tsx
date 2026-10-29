"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { scanStationKeys } from "@/lib/api/query-keys";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import {
  deleteScanStation,
  rotateScanStationToken,
  type ScanStation,
} from "@/app/seller/lib/api/scan-station";
import type { BaseResponse } from "@/lib/model";
import { copyScannerUrl } from "./scanner-setup-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stations: ScanStation[];
  onAdd: () => void;
};

export function ScannerManageDialog({ open, onOpenChange, stations, onAdd }: Props) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useApiMutation<BaseResponse<ScanStation> | void>();
  const [revealed, setRevealed] = useState<{ stationId: string; url: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ScanStation | null>(null);

  async function invalidateStations() {
    await queryClient.invalidateQueries({ queryKey: scanStationKeys.all });
  }

  async function newUrl(station: ScanStation) {
    try {
      const rotated = (await mutateAsync(rotateScanStationToken(station.id)))
        ?.data as ScanStation;
      setRevealed({ stationId: station.id, url: rotated.webhook_url ?? "" });
      toast.success("New URL issued — paste it into the scanner; the old one stops working");
      await invalidateStations();
    } catch {
      // toasted
    }
  }

  async function remove(station: ScanStation) {
    try {
      await mutateAsync(deleteScanStation(station.id));
      toast.success(`Removed ${station.label}`);
      setConfirmDelete(null);
      if (revealed?.stationId === station.id) setRevealed(null);
      await invalidateStations();
    } catch {
      // toasted
    }
  }

  return (
    <>
      <Modal
        open={open && confirmDelete === null}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) setRevealed(null);
        }}
        title="Scanners"
        description="Each scanner sends scans to its own private URL."
        footer={null}
      >
        <ul className="divide-y rounded-md border">
          {stations.map((station) => (
            <li key={station.id} className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-medium">{station.label}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => newUrl(station)}
                  disabled={isPending}
                >
                  <RefreshCw className="size-4" />
                  New URL
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setConfirmDelete(station)}
                  disabled={isPending}
                  aria-label={`Remove ${station.label}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {revealed?.stationId === station.id ? (
                <div className="flex gap-2">
                  <Input readOnly value={revealed.url} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyScannerUrl(revealed.url)}
                    aria-label="Copy scanner URL"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus className="size-4" />
          Add a scanner
        </Button>
      </Modal>
      <Modal
        open={confirmDelete !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmDelete(null);
        }}
        title={`Remove ${confirmDelete?.label ?? "scanner"}?`}
        description="Its URL stops working immediately and any batch in progress is lost."
        confirmLabel="Remove"
        confirmVariant="destructive"
        confirmPending={isPending}
        onConfirm={() => {
          if (confirmDelete) remove(confirmDelete);
        }}
      />
    </>
  );
}
