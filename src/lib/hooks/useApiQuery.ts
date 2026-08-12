import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type ApiFetchOptions = NonNullable<Parameters<typeof apiFetch>[1]>;

type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly unknown[]>,
  "queryKey"
> & {
  fetchOptions?: ApiFetchOptions;
};

/**
 * Standard read hook: semantic queryKey + URL from lib/api builders + apiFetch.
 * Prefer this over relying on QueryProvider's default queryFn.
 */
export function useApiQuery<T>(
  queryKey: readonly unknown[],
  url: string,
  options?: ApiQueryOptions<T>,
): UseQueryResult<T, Error> {
  const { fetchOptions, queryFn, ...queryOptions } = options ?? {};
  return useQuery({
    queryKey,
    queryFn: queryFn ?? (() => apiFetch<T>(url, fetchOptions)),
    ...queryOptions,
  });
}
