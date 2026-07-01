export const BUSINESS_BOOK_LISTING_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "DELETED",
] as const;

export type BusinessBookListingStatus =
  (typeof BUSINESS_BOOK_LISTING_STATUSES)[number];

export const SELLER_MUTABLE_LISTING_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
] as const;

export type SellerMutableListingStatus =
  (typeof SELLER_MUTABLE_LISTING_STATUSES)[number];

const LABELS: Record<BusinessBookListingStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Live",
  INACTIVE: "Paused",
  SUSPENDED: "Suspended",
  DELETED: "Deleted",
};

const DESCRIPTIONS: Partial<Record<BusinessBookListingStatus, string>> = {
  DRAFT:
    "Not published yet — customers cannot see or buy this listing. Only available before first go-live.",
  ACTIVE: "Live — visible when variants are active and in stock",
  INACTIVE:
    "Paused — hidden from customers; use after the listing has been live at least once",
  SUSPENDED:
    "Hidden by platform — fix listing details here, then contact support or wait for review to go live again",
};

/** Seller-selectable statuses from the listing's current status. */
const SELLER_LISTING_STATUS_TRANSITIONS: Record<
  SellerMutableListingStatus,
  readonly SellerMutableListingStatus[]
> = {
  DRAFT: ["DRAFT", "ACTIVE"],
  ACTIVE: ["ACTIVE", "INACTIVE"],
  INACTIVE: ["INACTIVE", "ACTIVE"],
};

export function allowedSellerListingStatuses(
  currentStatus: string,
): SellerMutableListingStatus[] {
  if (currentStatus in SELLER_LISTING_STATUS_TRANSITIONS) {
    return [
      ...SELLER_LISTING_STATUS_TRANSITIONS[
        currentStatus as SellerMutableListingStatus
      ],
    ];
  }
  if (isSellerMutableListingStatus(currentStatus)) {
    return [currentStatus];
  }
  return ["DRAFT"];
}

export function listingStatusLabel(status: string): string {
  return LABELS[status as BusinessBookListingStatus] ?? status;
}

export function listingStatusDescription(status: string): string | undefined {
  return DESCRIPTIONS[status as BusinessBookListingStatus];
}

export function isSellerMutableListingStatus(
  status: string,
): status is SellerMutableListingStatus {
  return (SELLER_MUTABLE_LISTING_STATUSES as readonly string[]).includes(
    status,
  );
}
