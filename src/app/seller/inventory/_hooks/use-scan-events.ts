"use client";

import { useEffect, useRef } from "react";
import { scanStationEventsPath, type ScanEvent } from "@/app/seller/lib/api/scan-station";

/**
 * Subscribe to station SSE through the auth proxy (fetch stream, not EventSource).
 */
export function useScanEvents(
  stationId: string | null,
  onEvent: (event: ScanEvent) => void,
  enabled = true,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!stationId || !enabled) return;

    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      const path = scanStationEventsPath(stationId!);
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
          console.log(10000, "reader", done, value);
          buffer += decoder.decode(value, { stream: true });
          console.log(1111, buffer)
          const chunks = buffer.split("\n\n");
          console.log(2222, chunks)
          buffer = chunks.pop() ?? "";
          console.log(3333, buffer)
          console.log(4444, chunks)
          for (const chunk of chunks) {
            const dataLine = chunk
              .split("\n")
              .find((line) => line.startsWith("data: "));
            if (!dataLine) continue;
            try {
              const payload = JSON.parse(dataLine.slice(6)) as ScanEvent;
              console.log(33333333, "reader", payload, "done", done, "value", value);
              if (payload?.isbn) {
                onEventRef.current(payload);
              }
            } catch {
              // ignore malformed frames
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted || cancelled) return;
        // brief backoff then effect cleanup/remount handles reconnect via deps
        console.warn("scan SSE disconnected", err);
      }
    }

    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [stationId, enabled]);
}
