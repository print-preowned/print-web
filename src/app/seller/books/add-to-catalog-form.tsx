"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Book, readBooks, createBook } from "@/lib/api/book";
import {
  createBusinessBook,
  readBusinessBooks,
} from "@/lib/api/business-book";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export function AddBookToCatalogForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newSynopsis, setNewSynopsis] = useState("");

  const { data: searchResult, isFetching: searchLoading } = useQuery({
    queryKey: ["books-search", searchTrigger, search],
    queryFn: () => apiFetch(readBooks({ page: 1, size: 20, filter: { search } })),
    enabled: searchTrigger > 0 && search.length >= 1,
  });
  const searchBooks: Book[] = searchResult?.data ?? [];

  const addMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const req = createBusinessBook({ book_id: bookId });
      return apiFetch(req.endpoint, { method: req.method, body: req.body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-books"] });
      toast.success("Added to your catalog");
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add"),
  });

  const createThenAddMutation = useMutation({
    mutationFn: async () => {
      const createReq = createBook({
        title: newTitle,
        image: newImage || "https://placehold.co/400",
        synopsis: newSynopsis || newTitle,
      });
      const createRes = await apiFetch<{ id: string }>(createReq.endpoint, {
        method: createReq.method,
        body: createReq.body,
      });
      const bookId = (createRes as { id?: string }).id;
      if (!bookId) throw new Error("No book id returned");
      const addReq = createBusinessBook({ book_id: bookId });
      await apiFetch(addReq.endpoint, { method: addReq.method, body: addReq.body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-books"] });
      toast.success("Book created and added to your catalog");
      setShowCreate(false);
      setNewTitle("");
      setNewImage("");
      setNewSynopsis("");
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create"),
  });

  return (
    <div className="flex flex-col gap-6 px-4 text-sm">
      <div className="space-y-2">
        <Label>Search global books</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchTrigger((t) => t + 1)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSearchTrigger((t) => t + 1)}
          >
            Search
          </Button>
        </div>
        {searchLoading && <p className="text-muted-foreground text-xs">Searching…</p>}
        {searchTrigger > 0 && !searchLoading && (
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded border p-2">
            {searchBooks.length === 0 ? (
              <li className="text-muted-foreground text-xs">No books found.</li>
            ) : (
              searchBooks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-2 rounded py-1.5 text-xs"
                >
                  <span className="truncate font-medium">{b.title}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addMutation.mutate(b.id)}
                    disabled={addMutation.isPending}
                  >
                    Add to catalog
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="border-t pt-4">
        {!showCreate ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCreate(true)}
          >
            Create new book (provisional) and add to catalog
          </Button>
        ) : (
          <div className="space-y-3">
            <Label>New provisional book</Label>
            <Input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Input
              placeholder="Image URL (optional)"
              type="url"
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
            />
            <Textarea
              placeholder="Synopsis"
              value={newSynopsis}
              onChange={(e) => setNewSynopsis(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={!newTitle.trim() || createThenAddMutation.isPending}
                onClick={() => createThenAddMutation.mutate()}
              >
                {createThenAddMutation.isPending ? "Creating…" : "Create and add"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        To request a merge or name change for a global book, contact the platform
        admin. You can still create a provisional book and list it here.
      </p>
    </div>
  );
}
