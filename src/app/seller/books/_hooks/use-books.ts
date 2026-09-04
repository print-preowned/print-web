"use client";

import { useMemo, useState } from "react";
import { Book, readBooks } from "@/lib/api/book";
import {
  SellerBook,
  readSellerBooks,
} from "@/lib/api/seller-book";
import { bookKeys, sellerBookKeys } from "@/lib/api/query-keys";
import { useSellerId } from "@/lib/auth/context";
import usePagination from "@/lib/pagination/usePagination";

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

export interface UseSellerBooksReturn {
  sellerBooks: SellerBook[];
  isLoading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  totalPages: number;
}

export function useSellerBooks(): UseSellerBooksReturn {
  const sellerId = useSellerId();

  const {
    data: sellerBooks,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<SellerBook>({
    queryKey: [...sellerBookKeys.all, sellerId ?? ""],
    getUrl: ({ page, size }) => {
      if (!sellerId) return "";
      return readSellerBooks({ page, size });
    },
    initialPageSize: 10,
    params: {},
    enabled: Boolean(sellerId),
  });

  return {
    sellerBooks,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  };
}
