"use client";

import { useMemo, useState } from "react";
import { Book, readBooks } from "@/lib/api/book";
import { bookKeys, sellerInventoryKeys } from "@/lib/api/query-keys";
import { useSellerId } from "@/lib/auth/context";
import usePagination from "@/lib/pagination/usePagination";
import {
  readSellerInventory,
  type SellerInventoryListItem,
} from "@/app/seller/lib/api/inventory";

function searchOrUndefined(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

export interface UseGlobalBooksReturn {
  books: Book[];
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
  } = usePagination<Book>({
    queryKey: [...bookKeys.globalList],
    getUrl: ({ page, size, search: q }) =>
      readBooks({
        page,
        size,
        filter: q ? { search: q as string } : undefined,
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
