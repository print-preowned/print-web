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
import { BusinessBook, updateBusinessBook } from "@/lib/api/business-book";
import { businessBookKeys } from "@/lib/api/query-keys";
import {
  allowedSellerListingStatuses,
  listingStatusDescription,
  listingStatusLabel,
  type SellerMutableListingStatus,
} from "@/lib/business-book-listing-status";
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

export function BusinessBookForm({
  businessBook,
  onSuccess,
}: {
  businessBook: BusinessBook;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const isSuspended = businessBook.status === "SUSPENDED";
  const statusOptions = allowedSellerListingStatuses(businessBook.status);
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      synopsis: businessBook.synopsis ?? "",
      image: businessBook.image ?? "",
      status: defaultListingStatus(businessBook.status, statusOptions),
    },
  });
  const status = watch("status");

  const image = useImageUpload({
    initialPreview: businessBook.image ?? null,
    onValueChange: (value) => setValue("image", value),
    fallback: "",
  });

  const updateMutation = useApiMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessBookKeys.all });
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
        onSubmit={handleSubmit(async (values) => {
          const resolvedImage = await image.resolveValue(values.image);
          updateMutation.mutate(
            updateBusinessBook(businessBook.id, {
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
                status={businessBook.status}
                label={listingStatusLabel(businessBook.status)}
              />
              <p className="text-muted-foreground text-xs">
                {listingStatusDescription(businessBook.status)}
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
