"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { readBookById, type Book } from "@/lib/api/book";
import type { BaseResponse } from "@/lib/model";
import { AdminBookForm } from "../../update-form";

export default function AdminEditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const back = () => router.push("/books");

  const { data, isLoading, error } = useQuery({
    queryKey: ["book", id],
    queryFn: () => apiFetch<BaseResponse<Book>>(readBookById(id)),
  });

  const book = data?.data;

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading book…</p>;
  }

  if (error || !book) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Book not found.</p>
        <button
          type="button"
          className="text-primary text-sm underline underline-offset-2"
          onClick={back}
        >
          Back to books
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Edit book</h1>
        <p className="text-muted-foreground text-sm">
          Update work details and manage publications.
        </p>
      </div>
      <AdminBookForm book={book} onSuccess={back} onCancel={back} />
    </div>
  );
}
