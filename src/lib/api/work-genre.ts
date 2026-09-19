export function createWorkGenre(
  workId: string,
  payload: { genre_id: string },
) {
  return {
    endpoint: `/works/${workId}/genres`,
    method: "POST" as const,
    body: payload,
  };
}

export function deleteWorkGenre(workId: string, genreId: string) {
  return {
    endpoint: `/works/${workId}/genres/${genreId}`,
    method: "DELETE" as const,
  };
}

export function readWorkGenres(workId: string) {
  return `/works/${workId}/genres`;
}
