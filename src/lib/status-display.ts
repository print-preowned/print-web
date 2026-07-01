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
