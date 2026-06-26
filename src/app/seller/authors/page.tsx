/**
 * Server Component - Authors Page
 * 
 * This page is a Server Component that renders static content.
 * The interactive table is a separate client component ("island").
 * 
 * Benefits:
 * - Smaller JavaScript bundle (only table component is client-side)
 * - Better SEO (static content rendered on server)
 * - Faster initial load
 */

import { AuthorsTable } from "./authors-table";

export default function AuthorsPage() {
  return (
    <div className="space-y-2">
      <AuthorsTable />
    </div>
  );
}
