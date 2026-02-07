import { DefinedUseInfiniteQueryResult, InfiniteData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { PaginatedResponse } from "../model";
import { PageParams, ReadParams } from "../api/types";
import reduceInfiniteData from "./reduceInfiniteData";

export default function usePagination<T>({
  queryKey,
  makePath,
  initialData,
  queryParams = { page: 1, size: 10 }
}: {
  queryKey: string[];
  makePath: (param: { page: number; size: number }) => string;
  initialData?: T | null;
  queryParams?: PageParams;
}) {
  const { ...query } = useInfiniteQuery<PaginatedResponse<T>, Error, InfiniteData<PaginatedResponse<T>>, unknown[], PageParams>({
    queryKey,
    queryFn: ({pageParam}) => {
        // console.log("data ======> ", data)
        return apiFetch(makePath({ page: pageParam.page, size: pageParam.size }))
    },
    getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
        return lastPage.pagination?.page ? { page: lastPage.pagination.page + 1, size: lastPage.pagination.size } : undefined;
    },
    initialPageParam: queryParams,
  });

  const data = reduceInfiniteData<T>(query.data);
  const totalPages = query.data?.pages[0].pagination?.total_pages || 0;
  const currentPage = query.data?.pages[0].pagination?.page || 1;

  return { ...query, queryKey, makePath, data, totalPages, currentPage };
}
