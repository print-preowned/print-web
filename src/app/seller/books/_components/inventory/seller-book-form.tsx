"use client";

import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageDropzone } from "@/components/image-dropzone";
import { StatusBadge } from "@/components/status-badge";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { SellerBook, updateSellerBook } from "@/lib/api/seller-book";
import { sellerBookKeys } from "@/lib/api/query-keys";
import {
  allowedSellerListingStatuses,
  listingStatusDescription,
  listingStatusLabel,
  type SellerMutableListingStatus,
} from "@/lib/seller-book-listing-status";
import { toast } from "sonner";

type FormValues = {
  synopsis: string;
  image: string;
  status: SellerMutableListingStatus;
};

function defaultListingStatus(
  status: string,
  allowed: SellerMutableListingStatus[],
): SellerMutableListingStatus {
  if ((allowed as readonly string[]).includes(status)) {
    return status as SellerMutableListingStatus;
  }
  return allowed[0] ?? "DRAFT";
}

export function SellerBookForm({
  sellerBook,
  onSuccess,
}: {
  sellerBook: SellerBook;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const isSuspended = sellerBook.status === "SUSPENDED";
  const statusOptions = allowedSellerListingStatuses(sellerBook.status);
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      synopsis: sellerBook.synopsis ?? "",
      image: sellerBook.image ?? "",
      status: defaultListingStatus(sellerBook.status, statusOptions),
    },
  });
  const status = watch("status");

  const image = useImageUpload({
    initialPreview: sellerBook.image ?? null,
    onValueChange: (value) => setValue("image", value),
    fallback: "",
  });

  const updateMutation = useApiMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerBookKeys.all });
      toast.success("Listing updated");
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message || "Update failed"),
  });

  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      <p className="text-muted-foreground text-xs">
        Book: <strong>{sellerBook.book_title ?? sellerBook.book_id}</strong>
      </p>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(async (values) => {
          const resolvedImage = await image.resolveValue(values.image);
          updateMutation.mutate(
            updateSellerBook(sellerBook.id, {
              synopsis: values.synopsis || undefined,
              image: resolvedImage || undefined,
              ...(isSuspended ? {} : { status: values.status }),
            }),
          );
        })}
      >
        <div className="grid gap-2">
          <Label htmlFor="listing-status">Listing status</Label>
          {isSuspended ? (
            <div className="flex flex-col gap-1">
              <StatusBadge
                status={sellerBook.status}
                label={listingStatusLabel(sellerBook.status)}
              />
              <p className="text-muted-foreground text-xs">
                {listingStatusDescription(sellerBook.status)}
              </p>
            </div>
          ) : (
            <>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as SellerMutableListingStatus)
                }
              >
                <SelectTrigger id="listing-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {listingStatusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {listingStatusDescription(status) && (
                <p className="text-muted-foreground text-xs">
                  {listingStatusDescription(status)}
                </p>
              )}
            </>
          )}
        </div>
        <ImageDropzone
          id="listing-cover"
          label="Listing image (optional)"
          preview={image.preview}
          inputRef={image.inputRef}
          onFileSelect={image.onFileSelect}
          onClear={image.clear}
        />
        <div className="grid gap-2">
          <Label htmlFor="synopsis">Synopsis (optional)</Label>
          <Textarea
            id="synopsis"
            {...register("synopsis")}
            placeholder="Brief description for your listing"
            rows={3}
          />
        </div>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving…" : "Save listing"}
        </Button>
      </form>
    </div>
  );
}
