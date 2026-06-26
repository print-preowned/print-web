"use client";

import { CreateBookForm } from "@/components/books/create-book-form";

type BookFormProps = {
  book?: { title?: string };
  onSuccess?: () => void;
};

export function BookForm({ book, onSuccess }: BookFormProps) {
  return (
    <CreateBookForm
      className="px-4"
      defaultTitle={book?.title}
      onSubmit={async () => {
        onSuccess?.();
      }}
      onCancel={onSuccess}
      showActions={!!onSuccess}
    />
  );
}
