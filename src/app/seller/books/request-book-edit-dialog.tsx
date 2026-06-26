"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Copy } from "lucide-react";
import type { Book } from "@/lib/api/book";
import { toast } from "sonner";

export function RequestBookEditDialog({
  book,
  open,
  onOpenChange,
}: {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const copyRef = (text: string) => () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request book update</DialogTitle>
          <DialogDescription>
            Request a merge, name change, or other correction for a global book.
            Contact the platform admin with the details below.
          </DialogDescription>
        </DialogHeader>
        {book && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Book ID</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={copyRef(book.id)}
              >
                <Copy className="size-3" />
                Copy
              </Button>
            </div>
            <code className="block break-all font-mono text-xs">{book.id}</code>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-muted-foreground">Title</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={copyRef(book.title)}
              >
                <Copy className="size-3" />
                Copy
              </Button>
            </div>
            <p className="font-medium">{book.title}</p>
          </div>
        )}
        <Alert className="border-muted bg-muted/30">
          <Info className="size-4" />
          <AlertTitle className="mb-0">How to request</AlertTitle>
          <AlertDescription>
            Contact the platform admin (e.g. support or help center) and include
            the book ID or title and the change you need (e.g. merge duplicates,
            correct name or metadata).
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
