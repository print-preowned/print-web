"use client"

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBook, updateBook, Book } from "@/lib/api/book";
import { readAuthors, Author } from "@/lib/api/author";
import { readGenresListUrl, Genre } from "@/lib/api/genre";
import {
  createBookAuthor,
  deleteBookAuthor,
  fetchBookAuthorByBook,
  BookAuthor,
} from "@/lib/api/book-author";
import {
  createBookGenre,
  deleteBookGenre,
  fetchBookGenreByBook,
  BookGenre,
} from "@/lib/api/book-genre";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/lib/api/user";
import { toast } from "sonner";
import {
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
type BookFormProps = {
  book?: Book;
  onSuccess?: () => void;
};

export function AdminBookForm({ book, onSuccess }: BookFormProps) {
  const queryClient = useQueryClient();
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const isEditing = !!book;

  const { data: authorsData } = useQuery<PaginatedResponse<Author>>({
    queryKey: ["authors", { page: 1, size: 200 }],
    queryFn: () => apiFetch(readAuthors({ page: 1, size: 200 })),
  });
  const authors = authorsData?.data ?? [];

  const { data: genresData } = useQuery<PaginatedResponse<Genre>>({
    queryKey: ["genres", { page: 1, size: 200 }],
    queryFn: () => apiFetch(readGenresListUrl({ page: 1, size: 200 })),
  });
  const genres = genresData?.data ?? [];

  const { data: linksData } = useQuery({
    queryKey: ["book-author", "by-book", book?.id],
    queryFn: () => fetchBookAuthorByBook(book!.id),
    enabled: !!book?.id,
  });
  const existingAuthorLinks: BookAuthor[] = linksData?.data ?? [];
  const linksInitializedRef = useRef(false);

  const { data: genreLinksData } = useQuery({
    queryKey: ["book-genre", "by-book", book?.id],
    queryFn: () => fetchBookGenreByBook(book!.id),
    enabled: !!book?.id,
  });
  const existingGenreLinks: BookGenre[] = genreLinksData?.data ?? [];

  useEffect(() => {
    if (!book?.id) {
      if (!book) linksInitializedRef.current = false;
      return;
    }
    if (!linksInitializedRef.current && linksData !== undefined && genreLinksData !== undefined) {
      setSelectedAuthorIds(existingAuthorLinks.map((l) => l.author_id));
      setSelectedGenreIds(existingGenreLinks.map((l) => l.genre_id));
      linksInitializedRef.current = true;
    }
  }, [book?.id, linksData, genreLinksData, existingAuthorLinks, existingGenreLinks]);

  useEffect(() => {
    if (!book) linksInitializedRef.current = false;
  }, [book]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: book || {
      title: "",
      image: "",
      synopsis: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (book) {
      setValue("title", book.title);
      setValue("image", book.image);
      setValue("synopsis", book.synopsis);
      setValue("status", book.status);
    }
  }, [book, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const request = await createBook({
        title: data.title,
        image: data.image,
        synopsis: data.synopsis,
      });
      const res = await apiFetch<{ id: string }>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      const bookId = (res as { id?: string }).id;
      if (bookId) {
        for (const authorId of selectedAuthorIds) {
          const linkReq = createBookAuthor({ book_id: bookId, author_id: authorId });
          await apiFetch(linkReq.endpoint, {
            method: linkReq.method,
            body: linkReq.body,
          });
        }
        for (const genreId of selectedGenreIds) {
          const linkReq = createBookGenre({ book_id: bookId, genre_id: genreId });
          await apiFetch(linkReq.endpoint, {
            method: linkReq.method,
            body: linkReq.body,
          });
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book-author"] });
      queryClient.invalidateQueries({ queryKey: ["book-genre"] });
      toast.success("Book created successfully!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create book");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const request = await updateBook(book!.id, data);
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      const existingAuthorIds = new Set(existingAuthorLinks.map((l) => l.author_id));
      const toAddAuthors = selectedAuthorIds.filter((id) => !existingAuthorIds.has(id));
      const toRemoveAuthors = existingAuthorLinks.filter((l) => !selectedAuthorIds.includes(l.author_id));
      for (const authorId of toAddAuthors) {
        const linkReq = createBookAuthor({ book_id: book!.id, author_id: authorId });
        await apiFetch(linkReq.endpoint, { method: linkReq.method, body: linkReq.body });
      }
      for (const link of toRemoveAuthors) {
        const delReq = deleteBookAuthor(link.id);
        await apiFetch(delReq.endpoint, { method: delReq.method });
      }
      const existingGenreIds = new Set(existingGenreLinks.map((l) => l.genre_id));
      const toAddGenres = selectedGenreIds.filter((id) => !existingGenreIds.has(id));
      const toRemoveGenres = existingGenreLinks.filter((l) => !selectedGenreIds.includes(l.genre_id));
      for (const genreId of toAddGenres) {
        const linkReq = createBookGenre({ book_id: book!.id, genre_id: genreId });
        await apiFetch(linkReq.endpoint, { method: linkReq.method, body: linkReq.body });
      }
      for (const link of toRemoveGenres) {
        const delReq = deleteBookGenre(link.id);
        await apiFetch(delReq.endpoint, { method: delReq.method });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book", book!.id] });
      queryClient.invalidateQueries({ queryKey: ["book-author"] });
      queryClient.invalidateQueries({ queryKey: ["book-genre"] });
      toast.success("Book updated successfully!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update book");
    },
  });

  const addGenre = (genreId: string) => {
    if (genreId && !selectedGenreIds.includes(genreId)) {
      setSelectedGenreIds([...selectedGenreIds, genreId]);
    }
  };

  const removeGenre = (genreId: string) => {
    setSelectedGenreIds(selectedGenreIds.filter((id) => id !== genreId));
  };

  const selectedGenres = genres.filter((g) => selectedGenreIds.includes(g.id));
  const availableGenres = genres.filter((g) => !selectedGenreIds.includes(g.id));

  const addAuthor = (authorId: string) => {
    if (authorId && !selectedAuthorIds.includes(authorId)) {
      setSelectedAuthorIds([...selectedAuthorIds, authorId]);
    }
  };

  const removeAuthor = (authorId: string) => {
    setSelectedAuthorIds(selectedAuthorIds.filter((id) => id !== authorId));
  };

  const selectedAuthors = authors.filter((a) => selectedAuthorIds.includes(a.id));
  const availableAuthors = authors.filter((a) => !selectedAuthorIds.includes(a.id));

  const onSubmit = async (data: any) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register("title", { required: "Title is required" })}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label>Genres</Label>
        <Select onValueChange={addGenre} value="">
          <SelectTrigger>
            <SelectValue placeholder="Add a genre..." />
          </SelectTrigger>
          <SelectContent>
            {availableGenres.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
            {availableGenres.length === 0 && (
              <SelectItem value="No options" disabled>
                No more genres to add
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {selectedGenres.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedGenres.map((g) => (
              <span
                key={g.id}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm flex items-center gap-2"
              >
                {g.name}
                <button
                  type="button"
                  onClick={() => removeGenre(g.id)}
                  className="hover:bg-primary/80 rounded-full"
                  aria-label={`Remove ${g.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="image">Image URL *</Label>
        <Input
          id="image"
          type="url"
          {...register("image", { required: "Image URL is required" })}
        />
        {errors.image && (
          <p className="text-sm text-red-500">{errors.image.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="synopsis">Synopsis *</Label>
        <Textarea
          id="synopsis"
          rows={6}
          {...register("synopsis", { required: "Synopsis is required" })}
        />
        {errors.synopsis && (
          <p className="text-sm text-red-500">{errors.synopsis.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label>Authors</Label>
        <Select onValueChange={addAuthor} value="">
          <SelectTrigger>
            <SelectValue placeholder="Add an author..." />
          </SelectTrigger>
          <SelectContent>
            {availableAuthors.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.first_name} {a.last_name}
              </SelectItem>
            ))}
            {availableAuthors.length === 0 && (
              <SelectItem value="No options" disabled>
                No more authors to add
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {selectedAuthors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedAuthors.map((a) => (
              <span
                key={a.id}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm flex items-center gap-2"
              >
                {a.first_name} {a.last_name}
                <button
                  type="button"
                  onClick={() => removeAuthor(a.id)}
                  className="hover:bg-secondary/80 rounded-full"
                  aria-label={`Remove ${a.first_name} ${a.last_name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <DrawerFooter className="pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Update Book"
            : "Create Book"}
        </Button>
        <DrawerClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </form>
  );
}
