/** TanStack Query key factories — keep keys semantic, not URL strings. */

export const businessBookKeys = {
  all: ["business-books"] as const,
  lookupByBookId: (bookId: string) =>
    ["business-books", "lookup", bookId] as const,
};

export const variantKeys = {
  byBusinessBook: (businessBookId: string) =>
    ["variants", businessBookId] as const,
};

export const variantTypeKeys = {
  all: ["variant-types"] as const,
};

export const variantOptionKeys = {
  byTypes: (typeIds: string[]) =>
    ["variant-options", ...typeIds] as const,
};

export const bookKeys = {
  search: (query: string) => ["books-search", query] as const,
};
