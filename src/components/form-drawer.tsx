"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export type DrawerFooterConfig = {
  formId: string;
  submitLabel: string;
  loadingLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  cancelLabel?: string;
};

export type DrawerConfig = {
  title: string;
  description?: string;
  children: ReactNode;
  /** Static footer defaults. Overridden while a child calls `useDrawerFooter`. */
  footer?: DrawerFooterConfig;
};

type DrawerFooterContextValue = {
  setFooter: (footer: DrawerFooterConfig | null) => void;
};

const DrawerFooterContext = createContext<DrawerFooterContextValue | null>(
  null,
);

export function useDrawerFooter(config: DrawerFooterConfig) {
  const setFooter = useContext(DrawerFooterContext)?.setFooter;

  useEffect(() => {
    if (!setFooter) return;
    setFooter(config);
    return () => setFooter(null);
  }, [
    setFooter,
    config.formId,
    config.submitLabel,
    config.loadingLabel,
    config.isLoading,
    config.disabled,
    config.cancelLabel,
  ]);
}

export function useFormDrawer() {
  const [drawer, setDrawer] = useState<DrawerConfig | null>(null);

  const openDrawer = (config: DrawerConfig) => {
    setDrawer(config);
  };

  const closeDrawer = () => {
    setDrawer(null);
  };

  return { drawer, openDrawer, closeDrawer };
}

export function FormDrawer({
  title,
  description,
  children,
  footer: staticFooter,
  onClose,
}: DrawerConfig & {
  onClose?: () => void;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [footerOverride, setFooterOverride] =
    useState<DrawerFooterConfig | null>(null);
  const footer = footerOverride ?? staticFooter ?? null;

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) onClose?.();
  };

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <DrawerFooterContext.Provider value={{ setFooter: setFooterOverride }}>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            {children}
          </div>
        </DrawerFooterContext.Provider>
        {footer && (
          <DrawerFooter className="pt-4">
            <Button
              type="submit"
              form={footer.formId}
              disabled={footer.isLoading || footer.disabled}
            >
              {footer.isLoading
                ? (footer.loadingLabel ?? "Saving...")
                : footer.submitLabel}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                {footer.cancelLabel ?? "Cancel"}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
