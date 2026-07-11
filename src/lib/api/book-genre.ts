export function createBookGenre(
  bookId: string,
  payload: { genre_id: string },
) {
  return {
    endpoint: `/books/${bookId}/genres`,
    method: "POST" as const,
    body: payload,
  };
}

export function deleteBookGenre(bookId: string, genreId: string) {
  return {
    endpoint: `/books/${bookId}/genres/${genreId}`,
    method: "DELETE" as const,
  };
}

export function readBookGenres(bookId: string) {
  return `/books/${bookId}/genres`;
}
