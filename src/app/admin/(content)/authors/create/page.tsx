"use client";

import { useRouter } from "next/navigation";
import { AdminAuthorForm } from "../form";

export default function AdminCreateAuthorPage() {
  const router = useRouter();
  const back = () => router.push("/authors");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create author</h1>
        <p className="text-muted-foreground text-sm">
          Add a canonical author record.
        </p>
      </div>
      <AdminAuthorForm onSuccess={back} />
    </div>
  );
}
