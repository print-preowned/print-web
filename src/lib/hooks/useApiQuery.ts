import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

/**
 * Standard read hook: semantic queryKey + URL from lib/api builders + apiFetch.
 * Prefer this over relying on QueryProvider's default queryFn.
 */
export function useApiQuery<T>(
  queryKey: readonly unknown[],
  url: string,
  options?: ApiQueryOptions<T>,
): UseQueryResult<T, Error> {
  return useQuery({
    queryKey,
    queryFn: () => apiFetch<T>(url),
    ...options,
  });
}
