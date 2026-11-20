"use client";

import { useMemo, useState } from "react";
import { workKeys, sellerInventoryKeys } from "@/lib/api/query-keys";
import { useSellerId } from "@/lib/auth/context";
import usePagination from "@/lib/pagination/usePagination";
import {
  readSellerInventory,
  readWorks,
  type CatalogWork,
  type SellerInventory,
  type SellerListingStatusFilter,
} from "@/app/seller/lib/api/inventory";

function searchOrUndefined(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

export interface UseGlobalBooksReturn {
  books: CatalogWork[];
  isLoading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  totalPages: number;
  searchApplied: string;
  setSearchApplied: (value: string) => void;
}

export function useGlobalBooks(): UseGlobalBooksReturn {
  const [searchApplied, setSearchApplied] = useState("");

  const params = useMemo(
    () => ({ search: searchOrUndefined(searchApplied) }),
    [searchApplied],
  );

  const {
    data: books,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<CatalogWork>({
    queryKey: [...workKeys.catalog, "seller"],
    getUrl: ({ page, size, search: q }) =>
      readWorks({
        page,
        size,
        search: typeof q === "string" && q ? q : undefined,
      }),
    initialPageSize: 10,
    params,
  });

  return {
    books,
    isLoading,
    pagination,
    setPagination,
    totalPages,
    searchApplied,
    setSearchApplied,
  };
}

export interface UseSellerInventoryReturn {
  inventory: SellerInventory[];
  isLoading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  totalPages: number;
  status: SellerListingStatusFilter | undefined;
  setStatus: (status: SellerListingStatusFilter | undefined) => void;
}

export function useSellerInventory(): UseSellerInventoryReturn {
  const sellerId = useSellerId();
  const [status, setStatus] = useState<SellerListingStatusFilter | undefined>();
  const params = useMemo(() => ({ status }), [status]);

  const {
    data: inventory,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<SellerInventory>({
    queryKey: [...sellerInventoryKeys.all, sellerId ?? ""],
    getUrl: ({ page, size }) => {
      if (!sellerId) return "";
      return readSellerInventory({ page, size, status });
    },
    initialPageSize: 10,
    params,
    enabled: Boolean(sellerId),
  });

  return {
    inventory,
    isLoading,
    pagination,
    setPagination,
    totalPages,
    status,
    setStatus: (next) => {
      setStatus(next);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
  };
}
