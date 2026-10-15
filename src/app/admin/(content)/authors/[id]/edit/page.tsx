"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { readAuthorById, type Author } from "@/lib/api/author";
import type { BaseResponse } from "@/lib/model";
import { AdminAuthorForm } from "../../form";

export default function AdminEditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const back = () => router.push("/admin/authors");

  const { data, isLoading, error } = useQuery({
    queryKey: ["author", id],
    queryFn: () => apiFetch<BaseResponse<Author>>(readAuthorById(id)),
  });

  const author = data?.data;

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading author…</p>;
  }

  if (error || !author) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Author not found.</p>
        <button
          type="button"
          className="text-primary text-sm underline underline-offset-2"
          onClick={back}
        >
          Back to authors
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Edit author</h1>
        <p className="text-muted-foreground text-sm">
          Update author details.
        </p>
      </div>
      <AdminAuthorForm author={author} onSuccess={back} />
    </div>
  );
}
