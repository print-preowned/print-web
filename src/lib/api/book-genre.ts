export function createBookGenre(
  workId: string,
  payload: { genre_id: string },
) {
  return {
    endpoint: `/works/${workId}/genres`,
    method: "POST" as const,
    body: payload,
  };
}

export function deleteBookGenre(workId: string, genreId: string) {
  return {
    endpoint: `/works/${workId}/genres/${genreId}`,
    method: "DELETE" as const,
  };
}

export function readBookGenres(workId: string) {
  return `/works/${workId}/genres`;
}
