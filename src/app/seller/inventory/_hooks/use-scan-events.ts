"use client";

import { useEffect, useRef } from "react";
import {
  scanStationEventsPath,
  type ScanEvent,
  type ScanEventScope,
} from "@/app/seller/lib/api/scan-station";

/**
 * Subscribe to station SSE through the auth proxy (fetch stream, not EventSource).
 * scope=user: interactive (claim holder only). scope=station: bulk queue watchers.
 */
export function useScanEvents(
  stationId: string | null,
  onEvent: (event: ScanEvent) => void,
  enabled = true,
  scope: ScanEventScope = "user",
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!stationId || !enabled) return;

    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      const path = scanStationEventsPath(stationId!, scope);
      try {
        const res = await fetch(`/api/proxy${path}`, {
          method: "GET",
          headers: { Accept: "text/event-stream" },
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const dataLine = chunk
              .split("\n")
              .find((line) => line.startsWith("data: "));
            if (!dataLine) continue;
            try {
              const payload = JSON.parse(dataLine.slice(6)) as ScanEvent;
              if (payload?.type === "claim_lost" || payload?.isbn) {
                onEventRef.current(payload);
              }
            } catch {
              // ignore malformed frames
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted || cancelled) return;
        console.warn("scan SSE disconnected", err);
      }
    }

    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [stationId, enabled, scope]);
}
