import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock,
  FilePen,
  GitMerge,
  PauseCircle,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive";

export type StatusDisplay = {
  label: string;
  variant: StatusBadgeVariant;
  icon: LucideIcon;
};

const STATUS_DISPLAY: Record<string, StatusDisplay> = {
  ACTIVE: { label: "Active", variant: "default", icon: CheckCircle2 },
  INACTIVE: { label: "Inactive", variant: "outline", icon: PauseCircle },
  DRAFT: { label: "Draft", variant: "secondary", icon: FilePen },
  PENDING: { label: "Pending", variant: "secondary", icon: Clock },
  PLACED: { label: "Placed", variant: "secondary", icon: Clock },
  CONFIRMED: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
  SHIPPED: { label: "Shipped", variant: "default", icon: CheckCircle2 },
  DELIVERED: { label: "Delivered", variant: "default", icon: CheckCircle2 },
  READY_FOR_PICKUP: {
    label: "Ready for pickup",
    variant: "default",
    icon: CheckCircle2,
  },
  PICKED_UP: { label: "Picked up", variant: "default", icon: CheckCircle2 },
  SUSPENDED: { label: "Suspended", variant: "destructive", icon: ShieldAlert },
  DELETED: { label: "Deleted", variant: "destructive", icon: Trash2 },
  NEW: { label: "New", variant: "secondary", icon: Sparkles },
  ACCEPTED: { label: "Accepted", variant: "default", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
  EXPIRED: { label: "Expired", variant: "outline", icon: Clock },
  REVOKED: { label: "Revoked", variant: "destructive", icon: Ban },
  CANONICAL: { label: "Canonical", variant: "default", icon: CheckCircle2 },
  PROVISIONAL: { label: "Provisional", variant: "secondary", icon: FilePen },
  MERGED: { label: "Merged", variant: "outline", icon: GitMerge },
  DEPRECATED: { label: "Deprecated", variant: "outline", icon: Archive },
  CANCELLED: { label: "Cancelled", variant: "outline", icon: XCircle },
  PAID: { label: "Paid", variant: "default", icon: CheckCircle2 },
  REFUNDED: { label: "Refunded", variant: "outline", icon: XCircle },
  FAILED: { label: "Failed", variant: "destructive", icon: XCircle },
  NONE: { label: "No online payment", variant: "outline", icon: CircleDashed },
  OPEN: { label: "Open", variant: "secondary", icon: Clock },
  RESOLVED_REFUND: {
    label: "Resolved — refund",
    variant: "outline",
    icon: CheckCircle2,
  },
  RESOLVED_RELEASE: {
    label: "Resolved — release",
    variant: "outline",
    icon: CheckCircle2,
  },
};

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getStatusDisplay(status: string): StatusDisplay {
  const key = status.trim().toUpperCase();
  const configured = STATUS_DISPLAY[key];
  if (configured) {
    return configured;
  }
  return {
    label: formatStatusLabel(status),
    variant: "outline",
    icon: CircleDashed,
  };
}
