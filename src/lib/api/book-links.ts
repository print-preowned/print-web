import { apiFetch } from ".";
import { createBookAuthor, deleteBookAuthor } from "./book-author";
import { createBookGenre, deleteBookGenre } from "./book-genre";

export async function linkBookAuthorsAndGenres(
  workId: string,
  authorIds: string[],
  genreIds: string[],
) {
  await syncBookAuthorGenreLinks(workId, authorIds, genreIds, [], []);
}

export async function syncBookAuthorGenreLinks(
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
      const req = createBookAuthor(workId, { author_id: authorId });
      await apiFetch(req.endpoint, { method: req.method, body: req.body });
    }),
    ...toRemoveAuthors.map(async (authorId) => {
      const req = deleteBookAuthor(workId, authorId);
      await apiFetch(req.endpoint, { method: req.method });
    }),
    ...toAddGenres.map(async (genreId) => {
      const req = createBookGenre(workId, { genre_id: genreId });
      await apiFetch(req.endpoint, { method: req.method, body: req.body });
    }),
    ...toRemoveGenres.map(async (genreId) => {
      const req = deleteBookGenre(workId, genreId);
      await apiFetch(req.endpoint, { method: req.method });
    }),
  ]).catch((e) => {
    throw new Error(`Failed to sync book author and genre links: ${e.message}`);
  });
}
