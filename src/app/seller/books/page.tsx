"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BooksTable } from "./books-table";
import { GlobalBooksTable } from "./global-books-table";
import { useGlobalBooks, useBusinessBooks } from "./use-books";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BottomDetailsPanel } from "@/components/bottom-details-panel";

export default function BooksPage() {
  const globalBooks = useGlobalBooks();
  const businessBooks = useBusinessBooks();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedBooks = globalBooks.books.filter((b) => selectedIds.has(b.id));
  const singleSelected = selectedBooks.length === 1 ? selectedBooks[0] : null;

  const [detailsPanelHeightPx, setDetailsPanelHeightPx] = useState(0);

  return (
    <>
      <div
        className="space-y-4"
        style={
          detailsPanelHeightPx > 0
            ? { paddingBottom: detailsPanelHeightPx }
            : undefined
        }
      >
        <Tabs defaultValue="catalogue" className="w-full">
          <TabsList>
            <TabsTrigger value="catalogue">My catalogue</TabsTrigger>
            <TabsTrigger value="global">Global books</TabsTrigger>
          </TabsList>
          <TabsContent value="catalogue" className="mt-4 space-y-4">
            <p className="text-muted-foreground text-sm">
              Books you’re selling. Edit listings or remove them here. To add more
              titles, use the <strong>Global books</strong> tab to search or
              create new books and add them to your catalogue.
            </p>
            <BooksTable
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
        open={singleSelected != null}
        ariaLabel="Book details"
        title="Book details"
        onHeightChange={setDetailsPanelHeightPx}
      >
        {singleSelected ? (
          <div className="grid gap-4 pb-4 sm:grid-cols-[auto_1fr]">
            {singleSelected.image && (
              <img
                src={singleSelected.image}
                alt=""
                className="h-32 w-24 rounded border object-cover"
              />
            )}
            <div className="flex min-w-0 flex-col gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Title</span>
                <p className="font-medium">{singleSelected.title}</p>
              </div>
              {singleSelected.authors?.length ? (
                <div>
                  <span className="text-muted-foreground">Authors</span>
                  <p>{singleSelected.authors.map((a) => a.name).join(", ")}</p>
                </div>
              ) : null}
              <div>
                <span className="text-muted-foreground">Status</span>
                <p>
                  <Badge variant="outline" className="text-xs">
                    {singleSelected.status}
                  </Badge>
                </p>
              </div>
              {singleSelected.synopsis ? (
                <div>
                  <span className="text-muted-foreground">Synopsis</span>
                  <p className="line-clamp-4">{singleSelected.synopsis}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </BottomDetailsPanel>
    </>
  );
}
