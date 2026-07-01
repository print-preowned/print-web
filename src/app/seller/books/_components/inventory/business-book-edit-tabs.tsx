"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessBook } from "@/lib/api/business-book";
import { BusinessBookForm } from "./business-book-form";
import { VariantsPanel } from "./variants-panel";

export function BusinessBookEditTabs({
  businessBook,
  initialTab = "listing",
  onSuccess,
}: {
  businessBook: BusinessBook;
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
        <BusinessBookForm businessBook={businessBook} onSuccess={onSuccess} />
      </TabsContent>
      <TabsContent value="variants" className="mt-4">
        <VariantsPanel businessBook={businessBook} />
      </TabsContent>
    </Tabs>
  );
}
