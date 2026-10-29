"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Copy, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { scanStationKeys } from "@/lib/api/query-keys";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import {
  claimScanStation,
  createScanStation,
  type ScanStation,
} from "@/app/seller/lib/api/scan-station";
import { playScanTone } from "@/app/seller/lib/scan-feedback";
import type { BaseResponse } from "@/lib/model";
import { useScanEvents } from "../../_hooks/use-scan-events";

type Step = "name" | "connect" | "test";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once the new scanner exists, so the bar can select it. */
  onReady: (station: ScanStation) => void;
};

export async function copyScannerUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Scanner URL copied");
  } catch {
    toast.error("Could not copy URL");
  }
}

export function ScannerSetupDialog({ open, onOpenChange, onReady }: Props) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useApiMutation<BaseResponse<ScanStation>>();
  const [step, setStep] = useState<Step>("name");
  const [label, setLabel] = useState("Front desk");
  const [station, setStation] = useState<ScanStation | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; code: string | null } | null>(
    null,
  );

  // A brand-new scanner is neither claimed nor batching, so the webhook
  // reports each scan as "not_listening" on the station channel — which is
  // exactly the proof that the scanner reaches us.
  useScanEvents(
    station?.id ?? null,
    (event) => {
      if (event.type !== "scan_rejected") return;
      const ok = event.reason !== "invalid_isbn" && event.reason !== "no_barcode";
      playScanTone(ok ? "ok" : "error");
      setTestResult({ ok, code: event.code ?? null });
    },
    open && step === "test",
    "station",
  );

  function reset() {
    setStep("name");
    setLabel("Front desk");
    setStation(null);
    setTestResult(null);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  async function create() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Give the scanner a name");
      return;
    }
    try {
      const created = (await mutateAsync(createScanStation(trimmed))).data;
      setStation(created);
      setStep("connect");
      await queryClient.invalidateQueries({ queryKey: scanStationKeys.all });
      onReady(created);
    } catch {
      // toasted
    }
  }

  async function finish() {
    if (!station) return;
    try {
      await mutateAsync(claimScanStation(station.id));
      await queryClient.invalidateQueries({ queryKey: scanStationKeys.all });
      toast.success("Scanner ready — each scan opens the add form");
      close();
    } catch {
      // toasted
    }
  }

  const stepTitle = {
    name: "Set up a scanner",
    connect: "Connect your scanner",
    test: "Test it",
  }[step];

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={stepTitle}
      description={`Step ${step === "name" ? 1 : step === "connect" ? 2 : 3} of 3`}
      footer={null}
    >
      {step === "name" ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            create();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="scanner-label">Where is this scanner?</Label>
            <Input
              id="scanner-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Front desk"
              autoFocus
            />
            <p className="text-muted-foreground text-sm">
              A name helps when you have more than one scanner.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? <LoaderCircle className="animate-spin" /> : null}
              Continue
            </Button>
          </div>
        </form>
      ) : null}

      {step === "connect" && station?.webhook_url ? (
        <div className="space-y-4">
          <p className="text-sm">
            In your scanner app, find the setting that sends scans to a URL (often called
            &ldquo;webhook&rdquo; or &ldquo;HTTP POST&rdquo;) and paste this in:
          </p>
          <div className="flex gap-2">
            <Input readOnly value={station.webhook_url} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyScannerUrl(station.webhook_url!)}
              aria-label="Copy scanner URL"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Keep it private — anyone with this URL can send scans. It&apos;s only shown now;
            you can issue a new one later under Manage scanners.
          </p>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep("test")}>
              I&apos;ve pasted it
            </Button>
          </div>
        </div>
      ) : null}

      {step === "test" ? (
        <div className="space-y-4">
          {testResult === null ? (
            <div className="flex items-center gap-3 rounded-md border border-dashed p-4">
              <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
              <p className="text-sm">Scan the barcode on the back of any book…</p>
            </div>
          ) : testResult.ok ? (
            <div className="flex items-center gap-3 rounded-md bg-green-500/10 p-4">
              <CheckCircle2 className="size-5 text-green-600" />
              <p className="text-sm">
                Connected! We received{" "}
                <span className="font-mono">{testResult.code}</span>.
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-amber-500/10 p-4 text-sm">
              Your scanner is connected, but that wasn&apos;t a book barcode
              {testResult.code ? (
                <>
                  {" "}
                  (<span className="font-mono">{testResult.code}</span>)
                </>
              ) : null}
              . Try the ISBN barcode — usually the one starting with 978 or 979.
            </div>
          )}
          <div className="flex justify-between gap-2">
            <Button type="button" variant="ghost" onClick={close}>
              Skip for now
            </Button>
            <Button type="button" onClick={() => finish()} disabled={isPending || !testResult?.ok}>
              Start scanning
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
