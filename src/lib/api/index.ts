import { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import { getCookie, AUTH_COOKIE_NAME } from "../cookies";
import { toast } from "sonner";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/** Thrown by apiFetch on non-OK or parse failure. Callers can check err.status (undefined for network/parse errors). */
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface Options {
  method?: RequestInit["method"];
  fetchOptions?: RequestInit;
  context?:
    | GetServerSidePropsContext
    | (GetStaticPropsContext & { req?: null });
  redirect?: "error" | "follow" | "manual";
}

export function getAuthToken(context?: Options["context"]) {
  return (
    getCookie(AUTH_COOKIE_NAME, context?.req?.headers.cookie ?? undefined) || ""
  );
}

/**
 * Client: uses /api/proxy with credentials (HttpOnly cookie sent automatically).
 * Paths starting with /api/ are same-origin and used as-is (e.g. /api/business/create).
 * Server (SSR with context): calls backend directly with token from cookie.
 */
function getFetchUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
  context?: Options["context"]
): string {
  const isClient = typeof window !== "undefined";
  const useProxy = isClient && !context;
  const pathStr = path.startsWith("/") ? path.slice(1) : path;
  if (useProxy) {
    const search = query
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    if (pathStr.startsWith("api/")) {
      return `/${pathStr}${search}`;
    }
    return `/api/proxy/${pathStr}${search}`;
  }
  const url = new URL(`${API_BASE_URL}/${pathStr}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }
  return url.href;
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    query?: Record<string, string | number | undefined | null>;
    context?: Options["context"];
  } = {},
): Promise<T> {
  const { method = "GET", body, headers, query, context } = options;
  const url = path.includes("http") ? path : getFetchUrl(path, query, context);
  const isClient = typeof window !== "undefined";
  const useProxy = isClient && !context;
  const token = useProxy ? null : getAuthToken(context);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      credentials: useProxy ? "include" : "same-origin",
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      ...(context ? { next: { revalidate: 0 } } : {}),
    });
  } catch (err) {
    if (isClient) {
      toast.error("Network error. Please check your connection and try again.");
    }
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      undefined
    );
  }

  if (!res.ok) {
    // Handle 401 Unauthorized (token expired/invalid) - do this first
    if (res.status === 401 && isClient) {
      const { logout } = await import("../auth/logout");
      toast.error("Your session has expired. Please log in again.");
      logout();
      throw new ApiError("Session expired", 401);
    }

    // Parse error message for other errors
    let errorMessage: string;
    try {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text) as {
          detail?:
            | string
            | Array<{
                type?: string;
                loc?: (string | number)[];
                msg?: string;
                input?: unknown;
              }>;
        };

        // Handle 422 validation errors (FastAPI format)
        if (res.status === 422 && Array.isArray(parsed.detail)) {
          const validationErrors = parsed.detail;
          const formattedErrors = validationErrors
            .map((error) => {
              const field =
                error.loc && error.loc.length > 1
                  ? error.loc.slice(1).join(".") // Skip "body" or "query" prefix
                  : "field";
              const message = error.msg || "Validation error";
              return `${field}: ${message}`;
            })
            .join(", ");
          errorMessage = `Validation error: ${formattedErrors}`;
        } else if (typeof parsed.detail === "string") {
          errorMessage = parsed.detail;
        } else {
          errorMessage = text || `Request failed: ${res.status}`;
        }
      } catch {
        errorMessage = text || `Request failed: ${res.status}`;
      }
    } catch {
      errorMessage = `Request failed: ${res.status}`;
    }

    if (isClient) {
      toast.error(errorMessage);
    }

    throw new ApiError(errorMessage, res.status);
  }

  // For successful responses, handle empty bodies (e.g., 201 Created)
  const text = await res.text();

  if (!text || text.trim() === "") {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    if (isClient) {
      toast.error("Invalid response from server.");
    }
    throw new ApiError("Invalid JSON response from server", res.status);
  }
}

export function generateUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
  context?: Options["context"],
) {
  return getFetchUrl(path, query, context);
}
