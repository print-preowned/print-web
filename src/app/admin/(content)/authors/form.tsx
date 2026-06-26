"use client"

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { createAuthor, updateAuthor, Author } from "@/lib/api/author";
import { readBooks, Book } from "@/lib/api/book";
import {
  createBookAuthor,
  deleteBookAuthor,
  fetchBookAuthorByAuthor,
  BookAuthor,
} from "@/lib/api/book-author";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/lib/api/user";
import { toast } from "sonner";
import { useDrawerFooter } from "@/components/form-drawer";

type AuthorFormProps = {
  author?: Author;
  onSuccess?: () => void;
};

export function AdminAuthorForm({ author, onSuccess }: AuthorFormProps) {
  const queryClient = useQueryClient();
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const isEditing = !!author;

  const { data: booksData } = useQuery<PaginatedResponse<Book>>({
    queryKey: ["books", { page: 1, size: 200 }],
    queryFn: () => apiFetch(readBooks({ page: 1, size: 200 })),
  });
  const books = booksData?.data ?? [];

  const { data: linksData } = useQuery({
    queryKey: ["book-author", "by-author", author?.id],
    queryFn: () => fetchBookAuthorByAuthor(author!.id),
    enabled: !!author?.id,
  });
  const existingLinks: BookAuthor[] = linksData?.data ?? [];
  const linksInitializedRef = useRef(false);

  useEffect(() => {
    if (!author?.id || linksData === undefined) {
      if (!author) linksInitializedRef.current = false;
      return;
    }
    if (!linksInitializedRef.current) {
      setSelectedBookIds(existingLinks.map((l) => l.book_id));
      linksInitializedRef.current = true;
    }
  }, [author?.id, linksData, existingLinks]);

  useEffect(() => {
    if (!author) linksInitializedRef.current = false;
  }, [author]);

  const addBook = (bookId: string) => {
    if (bookId && !selectedBookIds.includes(bookId)) {
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  const removeBook = (bookId: string) => {
    setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
  };

  const selectedBooks = books.filter((b) => selectedBookIds.includes(b.id));
  const availableBooks = books.filter((b) => !selectedBookIds.includes(b.id));

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: author || {
      first_name: "",
      last_name: "",
      middle_name: "",
      about: "",
      image: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (author) {
      setValue("first_name", author.first_name);
      setValue("last_name", author.last_name);
      setValue("middle_name", author.middle_name || "");
      setValue("about", author.about);
      setValue("image", author.image || "");
      setValue("status", author.status);
    }
  }, [author, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const request = createAuthor({
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name || null,
        about: data.about,
        image: data.image || "",
        status: data.status,
      });
      const res = await apiFetch<{ id: string }>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      const authorId = (res as { id?: string }).id;
      if (authorId && selectedBookIds.length > 0) {
        for (const bookId of selectedBookIds) {
          const linkReq = createBookAuthor({ book_id: bookId, author_id: authorId });
          await apiFetch(linkReq.endpoint, {
            method: linkReq.method,
            body: linkReq.body,
          });
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["book-author"] });
      toast.success("Author created successfully!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create author");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const request = await updateAuthor(author!.id, {
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name || null,
        about: data.about,
        image: data.image || "",
        status: data.status,
      });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      const existingBookIds = new Set(existingLinks.map((l) => l.book_id));
      const toAdd = selectedBookIds.filter((id) => !existingBookIds.has(id));
      const toRemove = existingLinks.filter((l) => !selectedBookIds.includes(l.book_id));
      for (const bookId of toAdd) {
        const linkReq = createBookAuthor({ book_id: bookId, author_id: author!.id });
        await apiFetch(linkReq.endpoint, {
          method: linkReq.method,
          body: linkReq.body,
        });
      }
      for (const link of toRemove) {
        const delReq = deleteBookAuthor({ book_id: link.book_id, author_id: link.author_id });
        await apiFetch(delReq.endpoint, { method: delReq.method });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author", author!.id] });
      queryClient.invalidateQueries({ queryKey: ["book-author"] });
      toast.success("Author updated successfully!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update author");
    },
  });

  const onSubmit = async (data: any) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useDrawerFooter({
    formId: "admin-author-form",
    submitLabel: isEditing ? "Update Author" : "Create Author",
    loadingLabel: isEditing ? "Updating..." : "Creating...",
    isLoading,
  });

  return (
    <form
      id="admin-author-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            {...register("first_name", { required: "First name is required" })}
          />
          {errors.first_name && (
            <p className="text-sm text-red-500">{errors.first_name.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            {...register("last_name", { required: "Last name is required" })}
          />
          {errors.last_name && (
            <p className="text-sm text-red-500">{errors.last_name.message as string}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="middle_name">Middle Name (Optional)</Label>
        <Input
          id="middle_name"
          {...register("middle_name")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          type="url"
          {...register("image")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="about">About *</Label>
        <Textarea
          id="about"
          rows={5}
          {...register("about", { required: "About is required" })}
        />
        {errors.about && (
          <p className="text-sm text-red-500">{errors.about.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="status">Status</Label>
        <Select
          value={watch("status") || author?.status || "ACTIVE"}
          onValueChange={(value) => setValue("status", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Books</Label>
        <Select onValueChange={addBook} value="">
          <SelectTrigger>
            <SelectValue placeholder="Add a book..." />
          </SelectTrigger>
          <SelectContent>
            {availableBooks.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.title}
              </SelectItem>
            ))}
            {availableBooks.length === 0 && (
              <SelectItem value="" disabled>
                No more books to add
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {selectedBooks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedBooks.map((b) => (
              <span
                key={b.id}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm flex items-center gap-2"
              >
                {b.title}
                <button
                  type="button"
                  onClick={() => removeBook(b.id)}
                  className="hover:bg-secondary/80 rounded-full"
                  aria-label={`Remove ${b.title}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
