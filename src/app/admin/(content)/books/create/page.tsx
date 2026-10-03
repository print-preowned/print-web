"use client";

import { useRouter } from "next/navigation";
import { AdminCreateBookForm } from "../create-form";

export default function AdminCreateBookPage() {
  const router = useRouter();
  const back = () => router.push("/admin/books");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create book</h1>
        <p className="text-muted-foreground text-sm">
          Add the work and its first publication.
        </p>
      </div>
      <AdminCreateBookForm onSuccess={back} onCancel={back} />
    </div>
  );
}
