"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable } from "./_components/inventory/inventory-table";
import { GlobalBooksTable } from "./_components/global-books/global-books-table";
import { useGlobalBooks, useSellerInventory } from "./_hooks/use-books";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { BottomDetailsPanel } from "@/components/bottom-details-panel";
import { listingStatusLabel } from "@/lib/seller-book-listing-status";
import { formatPrice } from "@/lib/format-price";
import { type CatalogWork, inventoryImage, inventoryTitle, type SellerInventory } from "@/app/seller/lib/api/inventory";

function formatCount(value: number) {
  return value.toLocaleString();
}

export default function InventoryPage() {
  const globalBooks = useGlobalBooks();
  const sellerInventory = useSellerInventory();
  const [activeTab, setActiveTab] = useState("inventory");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedInventory = sellerInventory.inventory.filter((row) =>
    selectedIds.has(row.id),
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
            <TabsTrigger value="global">Catalog</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory" className="mt-4 space-y-4">
            <p className="text-muted-foreground text-sm">
              Offers you&apos;re selling — condition, price, and stock.
              Add another offer for the same ISBN when condition or signed copies differ.
            </p>
            <InventoryTable
              selectedIds={selectedIds}
              onSelectId={setSelectedIds}
              inventory={sellerInventory.inventory}
              isLoading={sellerInventory.isLoading}
              pagination={sellerInventory.pagination}
              setPagination={sellerInventory.setPagination}
              totalPages={sellerInventory.totalPages}
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
        title=""
        onHeightChange={setDetailsPanelHeightPx}
      >
        {activeTab === "inventory" && singleInventory ? (
          <InventoryDetails offer={singleInventory} />
        ) : singleGlobal ? (
          <GlobalBookDetails book={singleGlobal} />
        ) : null}
      </BottomDetailsPanel>
    </div>
  );
}

function InventoryDetails({ offer }: { offer: SellerInventory }) {
  const image = inventoryImage(offer);
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
          <p className="font-medium">{inventoryTitle(offer)}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div>
            <span className="text-muted-foreground">Condition</span>
            <p>
              {offer.condition ?? "—"}
              {offer.signed ? " · Signed" : ""}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Price</span>
            <p className="tabular-nums">{formatPrice(offer.price)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Stock</span>
            <p className="tabular-nums">{formatCount(offer.stock)}</p>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Status</span>
          <p>
            <StatusBadge
              status={offer.status}
              label={listingStatusLabel(offer.status)}
            />
          </p>
        </div>
        {offer.description ? (
          <div>
            <span className="text-muted-foreground">Notes</span>
            <p className="line-clamp-4">{offer.description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GlobalBookDetails({ book }: { book: CatalogWork }) {
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
        {book.description ? (
          <div>
            <span className="text-muted-foreground">Description</span>
            <p className="line-clamp-4">{book.description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
