import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type AuthorName = {
  namePrefix?: string | null;
  namesBeforeKey?: string | null;
  prefixToKey?: string | null;
  keyNames: string;
  namesAfterKey?: string | null;
  nameSuffix?: string | null;
  displayNameFlat: string;
  displayNameInverted: string;
  displayOverride?: boolean;
};

export type AuthorNameInput = {
  namePrefix?: string | null;
  namesBeforeKey?: string | null;
  prefixToKey?: string | null;
  keyNames: string;
  namesAfterKey?: string | null;
  nameSuffix?: string | null;
  displayNameFlat?: string | null;
  displayNameInverted?: string | null;
  displayOverride?: boolean;
};

export type Author = {
  id: string;
  kind: string;
  name: AuthorName;
  nameSource: string;
  normalizedName: string;
  about: string;
  image?: string | null;
  followers?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function authorLabel(author: Pick<Author, "name">) {
  return author.name.displayNameFlat;
}

export function readAuthors(params?: ReadParams) {
  const queryParams = buildQueryParams(params);
  return generateUrl("/authors", queryParams);
}

export function createAuthor(payload: {
  kind?: string;
  name: AuthorNameInput;
  about: string;
  image: string;
  status?: string;
}) {
  return {
    endpoint: "/authors",
    method: "POST" as const,
    body: payload,
  };
}

export function updateAuthor(
  id: string,
  payload: Partial<Pick<Author, "kind" | "about" | "image" | "status">> & {
    name?: AuthorNameInput;
  },
) {
  return {
    endpoint: `/authors/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function readAuthorById(id: string) {
  return generateUrl(`/authors/${id}`);
}
