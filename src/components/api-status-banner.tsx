"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clock3,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
  WifiOff,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { API_STATUS_BANNER_EVENT } from "@/lib/api";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type BannerState =
  | { type: "forbidden" }
  | { type: "rate-limited"; retryAfter?: string }
  | { type: "unavailable" }
  | { type: "network" }
  | { type: "offline" };

type ApiStatusBannerDetail = {
  status?: number;
  retryAfter?: string;
  reason?: string;
  handled?: boolean;
};

type ApiStatusBannerProps = {
  initialError?: ApiStatusBannerDetail;
};

function bannerForApiFailure(
  detail: ApiStatusBannerDetail,
): BannerState | null {
  if (detail.status === 403) return { type: "forbidden" };
  if (detail.status === 429) {
    return { type: "rate-limited", retryAfter: detail.retryAfter };
  }
  if ([502, 503, 504].includes(detail.status ?? 0)) {
    return { type: "unavailable" };
  }
  if (detail.reason === "network") return { type: "network" };
  return null;
}

function retryAfterMessage(retryAfter?: string) {
  if (!retryAfter) return "Please wait a moment before trying again.";

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds > 0) {
    const rounded = Math.ceil(seconds);
    return `Please wait ${rounded} ${rounded === 1 ? "second" : "seconds"} before trying again.`;
  }

  const retryTime = Date.parse(retryAfter);
  if (Number.isFinite(retryTime) && retryTime > Date.now()) {
    const secondsUntilRetry = Math.ceil((retryTime - Date.now()) / 1000);
    return `Please wait about ${secondsUntilRetry} seconds before trying again.`;
  }

  return "Please wait a moment before trying again.";
}

export function ApiStatusBanner({ initialError }: ApiStatusBannerProps) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [banner, setBanner] = useState<BannerState | null>(() =>
    initialError ? bannerForApiFailure(initialError) : null,
  );

  useEffect(() => {
    const showBanner = (event: Event) => {
      const detail = (event as CustomEvent<ApiStatusBannerDetail>).detail;
      const nextBanner = bannerForApiFailure(detail ?? {});
      if (nextBanner) {
        if (detail) detail.handled = true;
        setBanner(nextBanner);
      }
    };
    const handleOffline = () => setBanner({ type: "offline" });
    const handleOnline = () =>
      setBanner((current) => (current?.type === "offline" ? null : current));

    window.addEventListener(API_STATUS_BANNER_EVENT, showBanner);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener(API_STATUS_BANNER_EVENT, showBanner);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setBanner(null);
    }
  }, [pathname]);

  if (!banner) return null;

  const isForbidden = banner.type === "forbidden";
  const isUnavailable = banner.type === "unavailable";
  const title =
    banner.type === "forbidden"
      ? "Access denied"
      : banner.type === "rate-limited"
        ? "Too many requests"
        : banner.type === "unavailable"
          ? "Service temporarily unavailable"
          : banner.type === "offline"
            ? "You’re offline"
            : "Connection problem";
  const description =
    banner.type === "forbidden"
      ? "You don’t have permission to view this resource or perform this action."
      : banner.type === "rate-limited"
        ? retryAfterMessage(banner.retryAfter)
        : banner.type === "unavailable"
          ? "The service couldn’t complete this request. Check again and retry."
          : banner.type === "offline"
            ? "Your device is offline. Reconnect to continue."
            : "Could not connect to the service. Check your connection and retry.";
  const Icon =
    banner.type === "forbidden"
      ? ShieldAlert
      : banner.type === "rate-limited"
        ? Clock3
        : banner.type === "unavailable"
          ? ServerCrash
          : WifiOff;

  return (
    <Alert
      variant={isForbidden ? "destructive" : "default"}
      className={`relative pr-12 ${isForbidden ? "bg-destructive/10" : "border-amber-500/40 bg-amber-500/10 [&>svg]:text-amber-700"}`}
    >
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {isUnavailable ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => window.location.reload()}
        >
          <RefreshCw />
          Retry
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={cn(
          "absolute right-2 top-2 !p-1",
          isForbidden
            ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
            : "text-amber-700 hover:bg-amber-500/10 hover:text-amber-700",
        )}
        aria-label="Dismiss message"
        onClick={() => setBanner(null)}
      >
        <X />
      </Button>
    </Alert>
  );
}
