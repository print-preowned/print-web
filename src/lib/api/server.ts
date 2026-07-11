/**
 * Server-side API helper for Next.js route handlers.
 * Used when proxying to the backend (e.g. auth routes).
 */

import { formatApiDetail } from "./format-error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function backendFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    token?: string | null;
  } = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, token } = options;
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    let detail: string;
    try {
      const parsed = JSON.parse(text) as { detail?: string | unknown };
      detail = formatApiDetail(parsed.detail, text || `Request failed: ${res.status}`);
    } catch {
      detail = text || `Request failed: ${res.status}`;
    }
    throw new Response(JSON.stringify({ detail }), { status: res.status });
  }

  if (!text || text.trim() === "") {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Response("Invalid JSON", { status: 500 });
  }
}
