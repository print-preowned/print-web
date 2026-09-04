"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  readPublicStoreInventory,
  type PublicCatalogSellerBook,
} from "@customer/api";
import usePagination from "@/lib/pagination/usePagination";
import { Button } from "@/components/ui/button";
import { CatalogSearchForm } from "../../books/catalog-search-form";
import { StoreListingCard } from "../store-listing-card";

function pageFromSearchParams(searchParams: URLSearchParams): number {
  const parsed = Number.parseInt(searchParams.get("page") ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function storeInventoryPath(
  storeId: string,
  q?: string,
  page = 1,
): string {
  const params = new URLSearchParams();
  const trimmed = q?.trim();
  if (trimmed) params.set("q", trimmed);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/stores/${storeId}?${qs}` : `/stores/${storeId}`;
}

type StoreInventoryProps = {
  storeId: string;
};

export function StoreInventory({ storeId }: StoreInventoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const pageFromUrl = pageFromSearchParams(searchParams);

  const [search, setSearch] = useState(qFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(qFromUrl);

  useEffect(() => {
    setSearch(qFromUrl);
    setDebouncedSearch(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === debouncedSearch) return;
    const timer = setTimeout(() => setDebouncedSearch(trimmed), 400);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const {
    data: listings,
    response,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<PublicCatalogSellerBook>({
    queryKey: ["store-inventory", storeId],
    getUrl: ({ page, size, search: q }) =>
      readPublicStoreInventory(storeId, {
        page,
        size,
        filter: q ? { search: q as string } : undefined,
      }),
    initialPageSize: 20,
    initialPage: pageFromUrl,
    params: { search: debouncedSearch || undefined },
  });

  useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === pageFromUrl - 1
        ? prev
        : { ...prev, pageIndex: pageFromUrl - 1 },
    );
  }, [pageFromUrl, setPagination]);

  useEffect(() => {
    if (debouncedSearch === qFromUrl) return;
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    router.replace(storeInventoryPath(storeId, debouncedSearch), {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see books catalog pattern
  }, [debouncedSearch, router, setPagination, storeId]);

  function goToPage(pageIndex: number) {
    setPagination((prev) => ({ ...prev, pageIndex }));
    router.replace(
      storeInventoryPath(storeId, debouncedSearch, pageIndex + 1),
      { scroll: false },
    );
  }

  function onSubmitQuery(query: string) {
    setSearch(query);
    setDebouncedSearch(query.trim());
  }

  const canGoPrev = pagination.pageIndex > 0;
  const canGoNext = pagination.pageIndex + 1 < totalPages;
  const totalResults = response?.pagination?.total_results ?? 0;
  const showSearch = debouncedSearch.length > 0 || totalResults > 20;

  return (
    <>
      {showSearch ? (
        <div className="sticky top-16 z-40 -mx-4 border-b border-border bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
          <CatalogSearchForm
            value={search}
            onChange={setSearch}
            onSubmitQuery={onSubmitQuery}
            placeholder="Search this store by title…"
          />
        </div>
      ) : null}

      <div className={showSearch ? "mt-10" : "mt-6"}>
        {isLoading && listings.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Loading inventory…</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">
              {debouncedSearch
                ? "No matching titles in this store. Try a different search."
                : "This store has no books listed yet."}
            </p>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((listing, i) => (
                <li key={listing.id}>
                  <StoreListingCard listing={listing} animationDelay={i * 50} />
                </li>
              ))}
            </ul>

            {totalPages > 1 ? (
              <div className="mt-12 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canGoPrev}
                  onClick={() => goToPage(pagination.pageIndex - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.pageIndex + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canGoNext}
                  onClick={() => goToPage(pagination.pageIndex + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
