"use client";

import { useMemo, useState } from "react";
import { workKeys, sellerInventoryKeys } from "@/lib/api/query-keys";
import { useSellerId } from "@/lib/auth/context";
import usePagination from "@/lib/pagination/usePagination";
import {
  readSellerInventory,
  readWorks,
  type CatalogWork,
  type SellerInventoryListItem,
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
  inventory: SellerInventoryListItem[];
  isLoading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  totalPages: number;
}

export function useSellerInventory(): UseSellerInventoryReturn {
  const sellerId = useSellerId();

  const {
    data: inventory,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<SellerInventoryListItem>({
    queryKey: [...sellerInventoryKeys.all, sellerId ?? ""],
    getUrl: ({ page, size }) => {
      if (!sellerId) return "";
      return readSellerInventory({ page, size });
    },
    initialPageSize: 10,
    params: {},
    enabled: Boolean(sellerId),
  });

  return {
    inventory,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  };
}
