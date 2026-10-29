import type { ScanEvent } from "@/app/seller/lib/api/scan-station";

let audioContext: AudioContext | null = null;

/**
 * Short confirmation tone so the person at the scanner knows a scan landed
 * without looking at the screen. Browsers only allow audio after a user
 * gesture on the page; before that this is a silent no-op.
 */
export function playScanTone(kind: "ok" | "error") {
  try {
    audioContext ??= new AudioContext();
    const ctx = audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === "ok" ? "sine" : "square";
    osc.frequency.value = kind === "ok" ? 1320 : 220;
    const duration = kind === "ok" ? 0.15 : 0.25;
    const volume = kind === "ok" ? 0.2 : 0.08;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio unavailable; visual feedback still shows.
  }
}

export function scanRejectedMessage(event: ScanEvent): string {
  const code = event.code ? ` (${event.code})` : "";
  switch (event.reason) {
    case "no_barcode":
      return "Scanner sent an empty scan";
    case "invalid_isbn":
      return `Not a book barcode${code}`;
    case "not_listening":
      return `Scan ignored${code} — turn on scanning to receive it`;
    default:
      return `Scan rejected${code}`;
  }
}
