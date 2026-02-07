/**
 * Server Component - Books Page
 *
 * Sellers can: read global books, add them to their catalog (business_book),
 * create provisional books, and CRUD their catalog listings. Requests for
 * global book updates (merge, name change) go through the platform admin.
 */

import { BooksTable } from "./books-table";
import { RequestBookUpdateNote } from "./request-book-update-note";

export default function BooksPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Books</h1>
      <RequestBookUpdateNote />
      <BooksTable />
    </div>
  );
}
