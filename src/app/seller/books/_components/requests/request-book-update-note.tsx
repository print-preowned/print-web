"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Info } from "lucide-react";

/**
 * Explains how sellers can request global book updates (merge, name change).
 * Per MDC: businesses cannot mutate canonical books; platform handles merges/corrections.
 */
export function RequestBookUpdateNote() {
  return (
    <Alert className="border-muted bg-muted/30">
      <Info className="size-4" />
      <AlertTitle className="mb-0">Request book update (merge or name change)</AlertTitle>
      <AlertDescription>
        <p className="text-sm text-muted-foreground">
          You can add global books to your inventory and create provisional books.
          To request a merge of duplicates or a name/correction for a global book,
          contact the platform admin (e.g. support or help center) and include the
          book ID or title and the change you need.
        </p>
      </AlertDescription>
    </Alert>
  );
}
