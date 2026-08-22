/**
 * The one fetch. Every API caller in the app funnels through `requestJson`.
 *
 * This module is isomorphic, so it must not import `sonner` (client-only) or
 * `next/headers` (server-only). It owns transport and body parsing; wrappers
 * own auth and error presentation. It intentionally carries neither poison
 * marker — if you feel the need to add one, the code belongs in a wrapper.
 */

import { formatApiDetail } from "./format-error";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryParams = Record<string, string | number | undefined | null>;

/** Thrown by apiFetch and serverApiFetch. `status` is absent for network and parse failures. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type RequestFailure = {
  ok: false;
  reason: "network" | "http" | "parse";
  /** Absent when the request never produced a response. */
  status?: number;
  message: string;
};

export type RequestResult<T> =
  | { ok: true; status: number; data: T }
  | RequestFailure;

export function isAbsoluteUrl(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

function applyQuery(target: URLSearchParams, query?: QueryParams): void {
  if (!query) return;
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      target.set(key, String(value));
    }
  });
}

/**
 * Environment-independent request signature. Same string on the server and in
 * the browser, so it is safe as a React Query key. Fetch wrappers attach the
 * origin (backend vs /api/proxy).
 *
 * Prefer this over importing `generateUrl` from `src/lib/api/index.ts`, which
 * also pulls in `apiFetch` and `sonner`.
 */
export function generateUrl(path: string, query?: QueryParams): string {
  const [pathname, existingSearch] = path.split("?", 2);
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const search = new URLSearchParams(existingSearch);
  applyQuery(search, query);
  const queryString = search.toString();
  return queryString ? `${normalized}?${queryString}` : normalized;
}

export const buildRelativeUrl = generateUrl;

/**
 * Absolute URL on the backend origin. Every server-side caller uses this.
 *
 * Absolute input is refused rather than honored. The proxy route passes
 * user-controlled paths through here, and resolving one against its own origin
 * would let the caller choose where the bearer token gets sent.
 */
export function buildBackendUrl(path: string, query?: QueryParams): string {
  if (isAbsoluteUrl(path)) {
    throw new ApiError("buildBackendUrl requires a relative path");
  }
  const url = new URL(`${API_BASE_URL}/${path.replace(/^\//, "")}`);
  applyQuery(url.searchParams, query);
  return url.href;
}

/**
 * Same-origin URL so the browser attaches the HttpOnly cookie. Paths already
 * under `/api` are our own route handlers; everything else goes through the
 * catch-all proxy that swaps the cookie for a bearer token.
 */
export function buildProxyUrl(path: string, query?: QueryParams): string {
  const [pathname, existingSearch] = path
    .replace(/^\//, "")
    .replace(/\/{2,}/g, "/")
    .split("?", 2);
  const base = pathname.startsWith("api/")
    ? `/${pathname}`
    : `/api/proxy/${pathname}`;
  const search = new URLSearchParams(existingSearch);
  applyQuery(search, query);
  const queryString = search.toString();
  return queryString ? `${base}?${queryString}` : base;
}

async function readErrorMessage(res: Response): Promise<string> {
  const fallback = `Request failed: ${res.status}`;
  let text: string;
  try {
    text = await res.text();
  } catch {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text) as { detail?: unknown };
    return formatApiDetail(parsed.detail, text || fallback);
  } catch {
    return text || fallback;
  }
}

/**
 * Performs the request and normalizes the outcome. Never throws: callers map
 * `RequestFailure` onto whatever their layer expects (ApiError, Response, ...).
 */
export async function requestJson<T>(
  url: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    token?: string | null;
    credentials?: RequestCredentials;
  } = {}
): Promise<RequestResult<T>> {
  const { method = "GET", body, headers, token, credentials } = options;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined || body === null ? undefined : JSON.stringify(body),
      cache: "no-store",
      ...(credentials ? { credentials } : {}),
    });
  } catch (err) {
    return {
      ok: false,
      reason: "network",
      message: err instanceof Error ? err.message : "Network error",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: "http",
      status: res.status,
      message: await readErrorMessage(res),
    };
  }

  if (res.status === 204 || res.status === 205) {
    return { ok: true, status: res.status, data: undefined as T };
  }

  let text: string;
  try {
    text = await res.text();
  } catch {
    return {
      ok: false,
      reason: "parse",
      status: res.status,
      message: "Could not read the response body",
    };
  }

  // A 201 with no body is normal for several backend routes.
  if (text.trim() === "") {
    return { ok: true, status: res.status, data: {} as T };
  }

  try {
    return { ok: true, status: res.status, data: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      reason: "parse",
      status: res.status,
      message: "Invalid JSON response from server",
    };
  }
}
