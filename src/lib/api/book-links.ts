import { apiFetch } from ".";
import { createBookAuthor, deleteBookAuthor } from "./book-author";
import { createBookGenre, deleteBookGenre } from "./book-genre";

export async function linkBookAuthorsAndGenres(
  bookId: string,
  authorIds: string[],
  genreIds: string[],
) {
  await syncBookAuthorGenreLinks(bookId, authorIds, genreIds, [], []);
}

export async function syncBookAuthorGenreLinks(
  bookId: string,
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
      const req = createBookAuthor({ book_id: bookId, author_id: authorId });
      await apiFetch(req.endpoint, { method: req.method, body: req.body });
    }),
    ...toRemoveAuthors.map(async (authorId) => {
      const req = deleteBookAuthor({ book_id: bookId, author_id: authorId });
      await apiFetch(req.endpoint, { method: req.method });
    }),
    ...toAddGenres.map(async (genreId) => {
      const req = createBookGenre({ book_id: bookId, genre_id: genreId });
      await apiFetch(req.endpoint, { method: req.method, body: req.body });
    }),
    ...toRemoveGenres.map(async (genreId) => {
      const req = deleteBookGenre({ book_id: bookId, genre_id: genreId });
      await apiFetch(req.endpoint, { method: req.method });
    }),
  ]).catch((e) => {
    throw new Error(`Failed to sync book author and genre links: ${e.message}`);
  });
}
