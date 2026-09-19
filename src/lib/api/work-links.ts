import { apiFetch } from ".";
import { createWorkAuthor, deleteWorkAuthor } from "./work-author";
import { createWorkGenre, deleteWorkGenre } from "./work-genre";

export async function linkWorkAuthorsAndGenres(
  workId: string,
  authorIds: string[],
  genreIds: string[],
) {
  await syncWorkAuthorGenreLinks(workId, authorIds, genreIds, [], []);
}

export async function syncWorkAuthorGenreLinks(
  workId: string,
  authorIds: string[],
  genreIds: string[],
  existingAuthorIds: string[],
  existingGenreIds: string[],
) {
  const existingAuthorIdSet = new Set(existingAuthorIds);
  const toAddAuthors = authorIds.filter((id) => !existingAuthorIdSet.has(id));
  const toRemoveAuthors = existingAuthorIds.filter(
    (id) => !authorIds.includes(id),
  );

  const existingGenreIdSet = new Set(existingGenreIds);
  const toAddGenres = genreIds.filter((id) => !existingGenreIdSet.has(id));
  const toRemoveGenres = existingGenreIds.filter(
    (id) => !genreIds.includes(id),
  );

  await Promise.all([
    ...toAddAuthors.map(async (authorId) => {
      const req = createWorkAuthor(workId, { author_id: authorId });
      await apiFetch(req.endpoint, { method: req.method, body: req.body });
    }),
    ...toRemoveAuthors.map(async (authorId) => {
      const req = deleteWorkAuthor(workId, authorId);
      await apiFetch(req.endpoint, { method: req.method });
    }),
    ...toAddGenres.map(async (genreId) => {
      const req = createWorkGenre(workId, { genre_id: genreId });
      await apiFetch(req.endpoint, { method: req.method, body: req.body });
    }),
    ...toRemoveGenres.map(async (genreId) => {
      const req = deleteWorkGenre(workId, genreId);
      await apiFetch(req.endpoint, { method: req.method });
    }),
  ]).catch((e) => {
    throw new Error(`Failed to sync work author and genre links: ${e.message}`);
  });
}
