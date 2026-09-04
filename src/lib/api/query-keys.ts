/** TanStack Query key factories — keep keys semantic, not URL strings. */

export const sellerBookKeys = {
  all: ["seller-books"] as const,
  lookupByBookId: (bookId: string) =>
    ["seller-books", "lookup", bookId] as const,
};

export const variantKeys = {
  bySellerBook: (sellerBookId: string) =>
    ["variants", sellerBookId] as const,
};

export const variantTypeKeys = {
  all: ["variant-types"] as const,
};

export const variantOptionKeys = {
  byTypes: (typeIds: string[]) =>
    ["variant-options", ...typeIds] as const,
};

export const bookKeys = {
  globalList: ["global-books"] as const,
  search: (query: string) => ["books-search", query] as const,
};
