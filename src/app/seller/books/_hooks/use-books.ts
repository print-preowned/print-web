"use client";

import { useMemo, useState } from "react";
import { Book, readBooks } from "@/lib/api/book";
import {
  BusinessBook,
  readBusinessBooks,
} from "@/lib/api/business-book";
import { businessBookKeys } from "@/lib/api/query-keys";
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
    [searchApplied]
  );

  const {
    data: books,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Book>({
    queryKey: ["global-books"],
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

export interface UseBusinessBooksReturn {
  businessBooks: BusinessBook[];
  isLoading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  totalPages: number;
}

export function useBusinessBooks(): UseBusinessBooksReturn {
  const {
    data: businessBooks,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<BusinessBook>({
    queryKey: [...businessBookKeys.all],
    getUrl: ({ page, size }) => readBusinessBooks({ page, size }),
    initialPageSize: 10,
  });

  return {
    businessBooks,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  };
}
