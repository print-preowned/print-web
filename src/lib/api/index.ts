/**
 * Deliberately has no `client-only` marker: public catalog pages are server
 * components and read through `apiFetch`, so this module must stay importable
 * from both layers. Anything that needs the auth cookie belongs in ./server,
 * which is marked `server-only`. See SERVER_COMPONENTS.md.
 */

import { toast } from "sonner";
import {
  ApiError,
  buildBackendUrl,
  buildProxyUrl,
  requestJson,
  type HttpMethod,
  type QueryParams,
  type RequestFailure,
} from "./core";

export const API_STATUS_BANNER_EVENT = "app:api-status-banner";

export { ApiError, generateUrl } from "./core";
export type { HttpMethod, QueryParams };

export function apiErrorToast(error: unknown, fallback: string): void {
  if (
    error instanceof ApiError &&
    error.bannerHandled
  ) {
    return;
  }
  toast.error(error instanceof Error ? error.message || fallback : fallback);
}

export const showApiErrorToast = apiErrorToast;

export type ApiFetchOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  query?: QueryParams;
  /** HTTP statuses that resolve as null without a client toast or thrown error. */
  silentStatuses?: number[];
};

/**
 * In the browser: goes through /api/proxy so the HttpOnly cookie is attached
 * and exchanged for a bearer token server-side.
 *
 * During SSR: calls the backend directly and sends no credentials, so this is
 * only usable for public endpoints. Authenticated server-side reads belong in
 * `serverApiFetch` (src/lib/api/server.ts), which reads the cookie itself.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers, query, silentStatuses } = options;
  const isClient = typeof window !== "undefined";
  const url = isClient
    ? buildProxyUrl(path, query)
    : buildBackendUrl(path, query);

  const result = await requestJson<T>(url, {
    method,
    body,
    headers: {
      // Free ngrok serves an HTML interstitial to browser UAs. Without this
      // header, fetch gets that page instead of JSON and the call fails.
      // Only the browser → ngrok hop needs it (page origin; proxy URLs are
      // relative). Server fetchers talk to localhost and skip this.
      ...(isClient && window.location.hostname.endsWith(".ngrok-free.app")
        ? { "ngrok-skip-browser-warning": "true" }
        : {}),
      ...headers,
    },
    credentials: isClient ? "include" : "same-origin",
  });

  if (result.ok) {
    return result.data;
  }
  return reportFailure<T>(result, isClient, silentStatuses);
}

async function reportFailure<T>(
  failure: RequestFailure,
  isClient: boolean,
  silentStatuses?: number[]
): Promise<T> {
  const silent =
    failure.status !== undefined && silentStatuses?.includes(failure.status);
  
  if (failure.status === 401 && isClient && !silent) {
    const isSessionExpired = !window.location.pathname.includes("/login");

    if (isSessionExpired) {
      const { forceLogout } = await import("../auth/logout");
      toast.error("Your session has expired. Please log in again.");
      await forceLogout();
      throw new ApiError(failure.message, { status: 401 });
    }

    toast.error("Invalid credentials");
    throw new ApiError(failure.message, { status: 401 });
  }

  if (silent) {
    return null as T;
  }

  const bannerStatus =
    failure.status === 403 ||
    failure.status === 429 ||
    [502, 503, 504].includes(failure.status ?? 0);
  if (isClient && (bannerStatus || failure.reason === "network")) {
    const detail = {
      status: failure.status,
      retryAfter: failure.retryAfter,
      reason: failure.reason,
      handled: false,
    };
    const event = new CustomEvent(API_STATUS_BANNER_EVENT, {
      detail,
    });
    window.dispatchEvent(event);
    throw new ApiError(
      failure.message,
      {
        status: failure.status,
        reason: failure.reason,
        retryAfter: failure.retryAfter,
        bannerHandled: detail.handled,
      },
    );
  }

  if (isClient) {
    toast.error(clientMessage(failure));
  }
  throw new ApiError(
    failure.message,
    {
      status: failure.status,
      reason: failure.reason,
      retryAfter: failure.retryAfter,
    },
  );
}

function clientMessage(failure: RequestFailure): string {
  if (failure.reason === "network") {
    return "Network error. Please check your connection and try again.";
  }
  if (failure.reason === "parse") {
    return "Invalid response from server.";
  }
  return failure.message;
}
