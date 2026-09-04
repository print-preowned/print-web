"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSwitchContext } from "@/components/context-switcher";
import { useAuth } from "@/lib/auth/context";
import { apiFetch } from "@/lib/api";
import { readSellers, type Seller } from "@/lib/api/seller";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

async function loadMemberships(): Promise<Seller[]> {
  const response = await apiFetch<{ data?: Seller[] }>(
    readSellers(),
  );
  return response.data ?? [];
}

function SellerMark({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <img src={logo} alt="" className="h-full w-full object-cover" />
    );
  }
  return (
    <span className="font-display text-xl font-bold text-accent" aria-hidden>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function SwitchToSeller({ children }: { children: (startSwitch: () => void, busy: boolean) => ReactNode }) {
  const { session } = useAuth();
  const { handleSwitchContext, isSwitching } = useSwitchContext({ targetContext: "SELLER" });
  const [open, setOpen] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const busy = isSwitching || loading;

  const startSwitch = async () => {
    if (busy) return;
    setLoading(true);
    try {
      const list = await loadMemberships();
      if (list.length === 0) {
        toast.error("No storefront linked to this account");
        return;
      }
      if (list.length === 1) {
        await handleSwitchContext(list[0].id);
        return;
      }
      setSellers(list);
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load storefronts");
    } finally {
      setLoading(false);
    }
  };

  const enterStorefront = async (seller: Seller) => {
    setPendingId(seller.id);
    try {
      await handleSwitchContext(seller.id);
      setOpen(false);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      {children(() => void startSwitch(), busy)}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!isSwitching) setOpen(next);
        }}
      >
        <DialogOverlay />
        <DialogContent className="max-w-lg gap-0 p-0">
          <div className="space-y-5 px-6 pb-6 pt-6">
            <DialogHeader className="space-y-2 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Seller context
              </p>
              <DialogTitle className="font-display text-2xl tracking-tight">
                Which shop?
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                You belong to more than one storefront. Pick the one to work in.
              </DialogDescription>
            </DialogHeader>

            <ul className="divide-y divide-border/70 border border-border/80">
              {sellers.map((seller) => {
                const owned = session?.id === seller.user_id;
                const entering = pendingId === seller.id;
                return (
                  <li key={seller.id}>
                    <button
                      type="button"
                      disabled={isSwitching}
                      onClick={() => void enterStorefront(seller)}
                      className={cn(
                        "storefront-hover-surface flex w-full items-center gap-4 px-4 py-4 text-left",
                        "disabled:pointer-events-none disabled:opacity-60",
                      )}
                    >
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-muted">
                        <SellerMark name={seller.name} logo={seller.logo} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-display block text-lg font-semibold leading-snug">
                          {seller.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                          <span>{owned ? "Owner" : "Staff"}</span>
                          {seller.description ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="line-clamp-1">{seller.description}</span>
                            </>
                          ) : null}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                        {entering ? "Entering" : "Enter"}
                        <ArrowRight className="size-4" aria-hidden />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SwitchToSellerMenuItem({
  startSwitch,
  busy,
}: {
  startSwitch: () => void;
  busy: boolean;
}) {
  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        startSwitch();
      }}
      disabled={busy}
    >
      <Building2 className="mr-2 h-4 w-4" />
      Switch to Seller
    </DropdownMenuItem>
  );
}
