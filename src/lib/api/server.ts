/**
 * Server-only API helpers. Both delegate to `requestJson` in ./core and differ
 * only in where the token comes from and how failures surface:
 *
 * - `serverApiFetch` — server components and server actions. Reads the auth
 *   cookie itself and throws ApiError, so pages never thread tokens by hand.
 * - `backendFetch` — route handlers under src/app/api. Takes an explicit token
 *   and throws a Response, so a handler can `return err` to pass the backend's
 *   status and detail straight through.
 *
 * See "API layer boundary" in SERVER_COMPONENTS.md for how this splits from
 * the isomorphic `apiFetch`.
 */

import "server-only";

import { getAuthTokenFromRequest } from "@/lib/auth/server-cookie";
import {
  ApiError,
  buildBackendUrl,
  requestJson,
  type HttpMethod,
  type QueryParams,
  type RequestFailure,
} from "./core";

export async function serverApiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    query?: QueryParams;
    /** HTTP statuses that resolve as null instead of throwing. */
    silentStatuses?: number[];
  } = {}
): Promise<T> {
  const { method = "GET", body, headers, query, silentStatuses } = options;
  const token = await getAuthTokenFromRequest();

  const result = await requestJson<T>(buildBackendUrl(path, query), {
    method,
    body,
    headers,
    token,
  });

  if (result.ok) {
    return result.data;
  }
  if (
    result.status !== undefined &&
    silentStatuses?.includes(result.status)
  ) {
    return null as T;
  }
  throw new ApiError(result.message, result.status);
}

export async function backendFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    query?: QueryParams;
    token?: string | null;
  } = {}
): Promise<T> {
  const { method = "GET", body, headers, query, token } = options;

  const result = await requestJson<T>(buildBackendUrl(path, query), {
    method,
    body,
    headers,
    token,
  });

  if (result.ok) {
    return result.data;
  }
  throw toErrorResponse(result);
}

function toErrorResponse(failure: RequestFailure): Response {
  const unreachable = failure.reason === "network";
  return new Response(
    JSON.stringify({
      detail: unreachable ? "Could not reach the API server" : failure.message,
    }),
    {
      status: unreachable ? 502 : (failure.status ?? 500),
      headers: { "Content-Type": "application/json" },
    }
  );
}
