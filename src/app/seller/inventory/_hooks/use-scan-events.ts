"use client";

import { useEffect, useRef, useState } from "react";
import {
  scanStationEventsPath,
  type ScanEvent,
  type ScanEventScope,
} from "@/app/seller/lib/api/scan-station";

const INITIAL_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    if (ms <= 0) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal.addEventListener("abort", onAbort);
  });
}

/**
 * Subscribe to station SSE through the auth proxy (fetch stream, not EventSource).
 * scope=user: interactive (claim holder only). scope=station: bulk queue watchers.
 * Reconnects with exponential backoff when the stream ends unexpectedly.
 * First retry is immediate; then 1s → 30s. `reconnecting` is true while offline/retrying.
 */
export function useScanEvents(
  stationId: string | null,
  onEvent: (event: ScanEvent) => void,
  enabled = true,
  scope: ScanEventScope = "user",
): { reconnecting: boolean } {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (!stationId || !enabled) {
      setReconnecting(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      const path = scanStationEventsPath(stationId!, scope);
      // First retry after a drop is immediate; then 1s, 2s, … capped at 30s.
      let delayMs = 0;

      while (!cancelled) {
        let lostClaim = false;
        try {
          const res = await fetch(`/api/proxy${path}`, {
            method: "GET",
            headers: { Accept: "text/event-stream" },
            credentials: "include",
            signal: controller.signal,
          });

          // Claim/auth/validation errors: wait for UI/deps to change.
          if (res.status >= 400 && res.status < 500) {
            setReconnecting(false);
            break;
          }

          if (res.ok && res.body) {
            setReconnecting(false);
            delayMs = 0;
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
                  if (payload?.type === "claim_lost") {
                    onEventRef.current(payload);
                    lostClaim = true;
                    break;
                  }
                  if (payload?.isbn) {
                    onEventRef.current(payload);
                  }
                } catch {
                  // ignore malformed frames
                }
              }
              if (lostClaim) break;
            }
          }
        } catch (err) {
          if (cancelled || controller.signal.aborted) break;
          console.warn("scan SSE disconnected", err);
        }

        if (lostClaim || cancelled || controller.signal.aborted) {
          setReconnecting(false);
          break;
        }

        setReconnecting(true);
        try {
          await sleep(delayMs, controller.signal);
        } catch {
          setReconnecting(false);
          break;
        }
        delayMs =
          delayMs === 0 ? INITIAL_DELAY_MS : Math.min(delayMs * 2, MAX_DELAY_MS);
      }
    }

    void run();
    return () => {
      cancelled = true;
      controller.abort();
      setReconnecting(false);
    };
  }, [stationId, enabled, scope]);

  return { reconnecting };
}
