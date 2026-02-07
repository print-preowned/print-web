"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { BusinessBook, updateBusinessBook } from "@/lib/api/business-book";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type FormValues = {
  synopsis: string;
  image: string;
  status: string;
};

export function BusinessBookForm({
  businessBook,
  onSuccess,
}: {
  businessBook: BusinessBook;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      synopsis: businessBook.synopsis ?? "",
      image: businessBook.image ?? "",
      status: businessBook.status ?? "ACTIVE",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const req = updateBusinessBook(businessBook.id, {
        synopsis: values.synopsis || undefined,
        image: values.image || undefined,
        status: values.status,
      });
      return apiFetch(req.endpoint, { method: req.method, body: req.body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-books"] });
      toast.success("Listing updated");
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message || "Update failed"),
  });

  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      <p className="text-muted-foreground text-xs">
        Book: <strong>{businessBook.book_title ?? businessBook.book_id}</strong>
      </p>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
      >
        <div className="grid gap-2">
          <Label htmlFor="synopsis">Synopsis (optional)</Label>
          <Textarea
            id="synopsis"
            {...register("synopsis")}
            placeholder="Brief description for your listing"
            rows={3}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="image">Image URL (optional)</Label>
          <Input
            id="image"
            type="url"
            {...register("image")}
            placeholder="https://..."
          />
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={watch("status")}
            onValueChange={(v) => setValue("status", v)}
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
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving…" : "Save listing"}
        </Button>
      </form>
    </div>
  );
}
