"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable } from "./_components/inventory/inventory-table";
import { GlobalBooksTable } from "./_components/global-books/global-books-table";
import { useGlobalBooks, useBusinessBooks } from "./_hooks/use-books";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { BottomDetailsPanel } from "@/components/bottom-details-panel";
import { listingStatusLabel } from "@/lib/business-book-listing-status";
import { BusinessBook } from "@/lib/api/business-book";
import { Book } from "@/lib/api/book";

function formatCount(value: number) {
  return value.toLocaleString();
}

function formatPrice(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BooksPage() {
  const globalBooks = useGlobalBooks();
  const businessBooks = useBusinessBooks();
  const [activeTab, setActiveTab] = useState("inventory");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedInventory = businessBooks.businessBooks.filter((b) =>
    selectedIds.has(b.id),
  );
  const selectedGlobal = globalBooks.books.filter((b) => selectedIds.has(b.id));
  const singleInventory =
    selectedInventory.length === 1 ? selectedInventory[0] : null;
  const singleGlobal = selectedGlobal.length === 1 ? selectedGlobal[0] : null;
  const detailsOpen =
    activeTab === "inventory"
      ? singleInventory != null
      : singleGlobal != null;

  const [detailsPanelHeightPx, setDetailsPanelHeightPx] = useState(0);

  return (
    <div className="relative min-h-full">
      <div
        className="space-y-4"
        style={
          detailsPanelHeightPx > 0
            ? { paddingBottom: detailsPanelHeightPx }
            : undefined
        }
      >
        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            setSelectedIds(new Set());
          }}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="inventory">My inventory</TabsTrigger>
            <TabsTrigger value="global">Global books</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory" className="mt-4 space-y-4">
            <p className="text-muted-foreground text-sm">
              Books you&apos;re selling — listings, variants, price, and stock.
              To add more titles, use the <strong>Global books</strong> tab to
              search or create books and add them to your inventory.
            </p>
            <InventoryTable
              selectedIds={selectedIds}
              onSelectId={setSelectedIds}
              books={businessBooks.businessBooks}
              isLoading={businessBooks.isLoading}
              pagination={businessBooks.pagination}
              setPagination={businessBooks.setPagination}
              totalPages={businessBooks.totalPages}
            />
          </TabsContent>
          <TabsContent value="global" className="mt-4">
            <GlobalBooksTable
              selectedIds={selectedIds}
              onSelectId={setSelectedIds}
              books={globalBooks.books}
              isLoading={globalBooks.isLoading}
              pagination={globalBooks.pagination}
              setPagination={globalBooks.setPagination}
              totalPages={globalBooks.totalPages}
              searchApplied={globalBooks.searchApplied}
              setSearchApplied={globalBooks.setSearchApplied}
            />
          </TabsContent>
        </Tabs>
      </div>

      <BottomDetailsPanel
        open={detailsOpen}
        ariaLabel="Book details"
        title="Book details"
        onHeightChange={setDetailsPanelHeightPx}
      >
        {activeTab === "inventory" && singleInventory ? (
          <InventoryDetails businessBook={singleInventory} />
        ) : singleGlobal ? (
          <GlobalBookDetails book={singleGlobal} />
        ) : null}
      </BottomDetailsPanel>
    </div>
  );
}

function InventoryDetails({ businessBook }: { businessBook: BusinessBook }) {
  const image = businessBook.image ?? businessBook.book_image;

  return (
    <div className="grid gap-4 pb-4 sm:grid-cols-[auto_1fr]">
      {image ? (
        <img
          src={image}
          alt=""
          className="h-32 w-24 rounded border object-cover"
        />
      ) : null}
      <div className="flex min-w-0 flex-col gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Title</span>
          <p className="font-medium">
            {businessBook.book_title ?? businessBook.book_id}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div>
            <span className="text-muted-foreground">Variants</span>
            <p className="tabular-nums">
              {formatCount(businessBook.variant_count ?? 0)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">From</span>
            <p className="tabular-nums">
              {businessBook.min_price != null
                ? formatPrice(businessBook.min_price)
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Stock</span>
            <p className="tabular-nums">
              {formatCount(businessBook.total_stock ?? 0)}
            </p>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Status</span>
          <p>
            <StatusBadge
              status={businessBook.status}
              label={listingStatusLabel(businessBook.status)}
            />
          </p>
        </div>
        {businessBook.synopsis ? (
          <div>
            <span className="text-muted-foreground">Synopsis</span>
            <p className="line-clamp-4">{businessBook.synopsis}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GlobalBookDetails({ book }: { book: Book }) {
  return (
    <div className="grid gap-4 pb-4 sm:grid-cols-[auto_1fr]">
      {book.image ? (
        <img
          src={book.image}
          alt=""
          className="h-32 w-24 rounded border object-cover"
        />
      ) : null}
      <div className="flex min-w-0 flex-col gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Title</span>
          <p className="font-medium">{book.title}</p>
        </div>
        {book.authors?.length ? (
          <div>
            <span className="text-muted-foreground">Authors</span>
            <p>{book.authors.map((a) => a.name).join(", ")}</p>
          </div>
        ) : null}
        <div>
          <span className="text-muted-foreground">Status</span>
          <p>
            <StatusBadge status={book.status} />
          </p>
        </div>
        {book.synopsis ? (
          <div>
            <span className="text-muted-foreground">Synopsis</span>
            <p className="line-clamp-4">{book.synopsis}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
