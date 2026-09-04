"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SellerBook } from "@/lib/api/seller-book";
import { SellerBookForm } from "./seller-book-form";
import { VariantsPanel } from "./variants-panel";

export function SellerBookEditTabs({
  sellerBook,
  initialTab = "listing",
  onSuccess,
}: {
  sellerBook: SellerBook;
  initialTab?: "listing" | "variants";
  onSuccess?: () => void;
}) {
  return (
    <Tabs defaultValue={initialTab} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="listing" className="flex-1">
          Listing
        </TabsTrigger>
        <TabsTrigger value="variants" className="flex-1">
          Variants & pricing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="listing" className="mt-4">
        <SellerBookForm sellerBook={sellerBook} onSuccess={onSuccess} />
      </TabsContent>
      <TabsContent value="variants" className="mt-4">
        <VariantsPanel sellerBook={sellerBook} />
      </TabsContent>
    </Tabs>
  );
}
