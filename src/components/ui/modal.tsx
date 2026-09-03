"use client";

import type { FormEvent, ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Custom footer. Overrides default cancel/confirm actions. */
  footer?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  confirmDisabled?: boolean;
  confirmPending?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  /** When set, body + footer are wrapped in a `<form>`. */
  onSubmit?: (e: FormEvent) => void;
  className?: string;
  contentClassName?: string;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  cancelLabel = "Cancel",
  confirmLabel,
  confirmVariant = "default",
  confirmDisabled = false,
  confirmPending = false,
  onCancel,
  onConfirm,
  onSubmit,
  className,
  contentClassName,
}: ModalProps) {
  function handleCancel() {
    onCancel?.();
    onOpenChange(false);
  }

  const showDefaultActions = footer === undefined && Boolean(confirmLabel || onConfirm);

  const resolvedFooter = footer !== undefined ? (
    footer
  ) : showDefaultActions ? (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={confirmPending}
        onClick={handleCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        type={onSubmit ? "submit" : "button"}
        variant={confirmVariant}
        disabled={confirmDisabled || confirmPending}
        onClick={onSubmit ? undefined : onConfirm}
      >
        {confirmLabel}
      </Button>
    </>
  ) : null;

  const body = (
    <>
      <DialogHeader className={cn(children || resolvedFooter ? "mb-4" : undefined)}>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {children ? <div className={cn("space-y-4", className)}>{children}</div> : null}
      {resolvedFooter ? (
        <DialogFooter className="mt-4 gap-2 sm:gap-0">{resolvedFooter}</DialogFooter>
      ) : null}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent className={contentClassName}>
        {onSubmit ? <form onSubmit={onSubmit}>{body}</form> : body}
      </DialogContent>
    </Dialog>
  );
}
