import { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import { getCookie } from "../cookies";
import { toast } from "sonner";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface Options {
  method?: RequestInit["method"];
  fetchOptions?: RequestInit;
  context?:
    | GetServerSidePropsContext
    | (GetStaticPropsContext & { req?: null });
  redirect?: "error" | "follow" | "manual";
}

export function getAuthHeader(context?: Options["context"]) {
  return (
    getCookie("authHeader", context?.req?.headers.cookie ?? undefined) || ""
  );
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    query?: Record<string, string | number | undefined | null>;
  } = {},
): Promise<T> {
  const { method = "GET", body, headers, query } = options;
  const url = (query || !path.includes("http")) ? generateUrl(path, query) : path;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...{ Authorization: `Bearer ${getAuthHeader()}` },
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    // Handle 401 Unauthorized (token expired/invalid) - do this first
    if (res.status === 401 && typeof window !== "undefined") {
      // Import logout dynamically to avoid circular dependencies
      const { logout } = await import("../auth/logout");
      toast.error("Your session has expired. Please log in again.");
      logout();
      throw new Error("Session expired");
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

    if (typeof window !== "undefined") {
      toast.error(errorMessage);
    }

    throw new Error(errorMessage);
  }

  // For successful responses, handle empty bodies (e.g., 201 Created)
  const text = await res.text();

  if (!text || text.trim() === "") {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

export function generateUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.href;
}
