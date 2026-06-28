import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/lib/api/user";

export interface UsePaginationOptions<T> {
  /** Base query key (e.g. ["books"]). Pagination and params are appended for the request. */
  queryKey: string[];
  /** Builds the URL for a given page/size (1-based page for API). Optional filter params are passed when provided. */
  getUrl: (params: { page: number; size: number } & Record<string, unknown>) => string;
  /** Initial page size. Default 10. */
  initialPageSize?: number;
  /** Optional filter/search params included in query key and passed to getUrl. */
  params?: Record<string, unknown>;
}

export interface UsePaginationResult<T> {
  /** Current page items. */
  data: T[];
  /** Full API response (for total_pages, etc.). */
  response: PaginatedResponse<T> | undefined;
  /** Loading state. */
  isLoading: boolean;
  /** 0-based page index and page size for table state. */
  pagination: { pageIndex: number; pageSize: number };
  /** Update pagination (e.g. when user changes page). */
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  /** Total number of pages from API. */
  totalPages: number;
}

export default function usePagination<T>({
  queryKey,
  getUrl,
  initialPageSize = 10,
  params = {},
}: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const { data: response, isLoading } = useQuery<PaginatedResponse<T>>({
    queryKey: [...queryKey, pagination.pageIndex, pagination.pageSize, params],
    queryFn: () =>
      apiFetch(
        getUrl({
          page: pagination.pageIndex + 1,
          size: pagination.pageSize,
          ...params,
        }),
      ),
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  const data = response?.data ?? [];
  const totalPages = response?.pagination?.total_pages ?? 1;

  return {
    data,
    response,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  };
}
