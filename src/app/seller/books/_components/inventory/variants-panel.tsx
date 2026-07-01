"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BusinessBook } from "@/lib/api/business-book";
import { businessBookKeys, variantKeys } from "@/lib/api/query-keys";
import {
  deleteVariant,
  formatVariantConfig,
  readVariants,
  VariantWithConfig,
} from "@/lib/api/variant";
import { PaginatedResponse } from "@/lib/api/user";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { AddVariantForm } from "./add-variant-form";
import { PlusCircleIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function VariantsPanel({ businessBook }: { businessBook: BusinessBook }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  const variantsQuery = useApiQuery<PaginatedResponse<VariantWithConfig>>(
    variantKeys.byBusinessBook(businessBook.id),
    readVariants(businessBook.id, { page: 1, size: 100 }),
  );

  const variants = variantsQuery.data?.data ?? [];

  const deleteMutation = useApiMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: variantKeys.byBusinessBook(businessBook.id),
      });
      void queryClient.invalidateQueries({ queryKey: businessBookKeys.all });
      toast.success("Variant removed");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to remove variant"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Sellable SKUs with condition, format, price, and stock.
        </p>
        {!showAddForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            <PlusCircleIcon className="mr-1.5 size-4" />
            Add variant
          </Button>
        )}
      </div>

      {showAddForm && (
        <AddVariantForm
          businessBook={businessBook}
          onSuccess={() => setShowAddForm(false)}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {variantsQuery.isLoading ? (
        <p className="text-muted-foreground text-xs">Loading variants…</p>
      ) : variants.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-xs">
          No variants yet. Add at least one to make this listing purchasable.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Options</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="text-xs">
                  {formatVariantConfig(v.config)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatMoney(v.price, v.currency)}
                  {v.discount != null && v.discount > 0 ? (
                    <span className="text-muted-foreground ml-1">
                      (−{v.discount}%)
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-xs">{v.stock}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {v.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-8"
                    aria-label="Remove variant"
                    onClick={() => {
                      if (
                        confirm(
                          "Remove this variant? It will no longer be available for sale.",
                        )
                      ) {
                        deleteMutation.mutate(
                          deleteVariant(businessBook.id, v.id),
                        );
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
