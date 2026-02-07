"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="text-sm text-destructive">{error.message || "Something went wrong."}</div>
  );
}



