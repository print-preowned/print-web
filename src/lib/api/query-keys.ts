/** TanStack Query key factories — keep keys semantic, not URL strings. */

export const sellerInventoryKeys = {
  all: ["seller-inventory"] as const,
};

export const publicationKeys = {
  byWork: (workId: string) => ["publications", "work", workId] as const,
};

export const workKeys = {
  catalog: ["works-catalog"] as const,
  search: (query: string) => ["works-search", query] as const,
};

export const bookKeys = {
  globalList: ["global-books"] as const,
  search: (query: string) => ["books-search", query] as const,
};
