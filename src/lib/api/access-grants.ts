import { generateUrl } from "@/lib/api";

/** Longest onboarding access a store can grant, in days. Matches the server. */
export const MAX_GRANT_DAYS = 14;

export type AccessGrantStatus =
  | "PENDING"
  | "ACTIVE"
  | "DECLINED"
  | "WITHDRAWN"
  | "REVOKED"
  | "ENDED"
  | "EXPIRED";

export type AccessGrant = {
  id: string;
  sellerId: string;
  sellerName: string | null;
  kind: "ONBOARDING";
  status: AccessGrantStatus;
  note: string | null;
  durationDays: number;
  requestedByUserId: string;
  decidedByUserId: string | null;
  decidedAt: string | null;
  expiresAt: string | null;
  endedByUserId: string | null;
  endedAt: string | null;
  /** Why it was declined, withdrawn, revoked or ended. Null when it expired. */
  closeReason: string | null;
  createdAt: string;
};

export type OnboardingSellerOption = { id: string; name: string };

export const ACCESS_GRANT_STATUS_LABELS: Record<AccessGrantStatus, string> = {
  PENDING: "Waiting for seller",
  ACTIVE: "Active",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
  REVOKED: "Revoked by seller",
  ENDED: "Ended",
  EXPIRED: "Expired",
};

// Platform staff

export function readStaffAccessGrants(openOnly: boolean) {
  return generateUrl("/seller-access-grants", { open_only: String(openOnly) });
}

export function searchOnboardingSellers(search: string) {
  return generateUrl("/seller-access-grants/sellers", { search });
}

export function requestAccessGrant(payload: {
  sellerId: string;
  durationDays: number;
  note?: string;
}) {
  return {
    endpoint: "/seller-access-grants",
    method: "POST" as const,
    body: payload,
  };
}

export function withdrawAccessGrant(id: string, reason: string) {
  return {
    endpoint: `/seller-access-grants/${id}/withdraw`,
    method: "POST" as const,
    body: { reason },
  };
}

// Seller owner

export function readSellerAccessGrants() {
  return generateUrl("/seller-access-grants/seller");
}

export function decideAccessGrant(
  id: string,
  decision: "approve" | "decline" | "revoke",
  reason?: string,
) {
  return {
    endpoint: `/seller-access-grants/${id}/${decision}`,
    method: "POST" as const,
    body: reason ? { reason } : {},
  };
}

/** "in 6 days", "in 5 hours", or "now" for an expiry time. */
export function timeLeft(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "now";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 48)
    return `in ${Math.max(hours, 1)} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `in ${days} days`;
}
