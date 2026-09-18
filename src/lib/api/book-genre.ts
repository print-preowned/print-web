export function createBookGenre(
  bookId: string,
  payload: { genre_id: string },
) {
  return {
    endpoint: `/works/${bookId}/genres`,
    method: "POST" as const,
    body: payload,
  };
}

export function deleteBookGenre(bookId: string, genreId: string) {
  return {
    endpoint: `/works/${bookId}/genres/${genreId}`,
    method: "DELETE" as const,
  };
}

export function readBookGenres(bookId: string) {
  return `/works/${bookId}/genres`;
}
