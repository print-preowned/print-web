"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export type BottomDetailsPanelProps = {
  /** When false, nothing is rendered. */
  open: boolean;
  /** Accessible name for the region (e.g. "Book details"). */
  ariaLabel: string;
  /** Heading shown in the top bar of the panel. */
  title?: ReactNode;
  /** Optional actions (e.g. close button) aligned to the right of the title row. */
  headerRight?: ReactNode;
  /** Main content below the panel header. */
  children: ReactNode;
  /** Optional class overrides on the outer `<section>`. */
  className?: string;
  /**
   * Called with the panel’s pixel height while open (updates on resize).
   * Called with `0` when closed or unmounted — use for main content `padding-bottom`.
   */
  onHeightChange?: (heightPx: number) => void;
}

/**
 * Viewport-fixed bottom sheet: stays pinned while the page scrolls.
 * Pair with `onHeightChange` + main content `padding-bottom` so content isn’t hidden underneath.
 */
export function BottomDetailsPanel({
  open,
  ariaLabel,
  title,
  headerRight,
  children,
  className,
  onHeightChange,
}: BottomDetailsPanelProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const onHeightChangeRef = useRef(onHeightChange);
  onHeightChangeRef.current = onHeightChange;

  useEffect(() => {
    if (!open) {
      onHeightChangeRef.current?.(0);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;

    const report = () => {
      onHeightChangeRef.current?.(el.offsetHeight);
    };

    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => {
      ro.disconnect();
      onHeightChangeRef.current?.(0);
    };
  }, [open]);

  if (!open) return null;

  return (
    <section
      ref={sectionRef}
      aria-label={ariaLabel}
      className={cn(
        "border-t bg-sidebar absolute inset-x-0 bottom-0 z-20 max-h-[40vh] overflow-y-auto border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-start justify-between gap-2 py-3">
          {title != null ? (
            <h3 className="text-sm font-semibold">{title}</h3>
          ) : (
            <span className="sr-only">{ariaLabel}</span>
          )}
          {headerRight}
        </div>
        {children}
      </div>
    </section>
  );
}
