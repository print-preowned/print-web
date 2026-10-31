import { generateUrl } from "@/lib/api";

export type ScanStation = {
  id: string;
  seller_id: string;
  label: string;
  claimed_by_user_id: string | null;
  active_session_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  webhook_url?: string | null;
  token?: string;
};

export type ScanSessionItem = {
  isbn: string;
  quantity: number;
};

export type ScanSession = {
  id: string;
  station_id: string;
  /** First-scan order; quantity counts repeat scans of the same ISBN. */
  items: ScanSessionItem[];
  /** Total copies scanned. */
  count: number;
};

export type ScanSessionResolveItem = {
  isbn: string;
  publication_id: string | null;
  title: string | null;
  found: boolean;
};

export type ScanSessionImportResult = {
  isbn: string;
  inventory_id: string | null;
  status: string | null;
  error: string | null;
};

export type ScanRejectedReason = "no_barcode" | "invalid_isbn" | "not_listening";

export type ScanEvent = {
  type: "scan" | "session_item" | "session_item_removed" | "scan_rejected" | "claim_lost";
  isbn?: string;
  station_id: string;
  seller_id?: string;
  session_id?: string;
  added?: boolean;
  quantity?: number;
  count?: number;
  /** Raw scanned value on scan_rejected. */
  code?: string | null;
  reason?: "claimed" | "released" | ScanRejectedReason;
};

export function listScanStations() {
  return generateUrl("/scan-stations");
}

export function createScanStation(label: string) {
  return {
    endpoint: "/scan-stations",
    method: "POST" as const,
    body: { label },
  };
}

export function rotateScanStationToken(stationId: string) {
  return {
    endpoint: `/scan-stations/${stationId}/rotate-token`,
    method: "POST" as const,
  };
}

export function claimScanStation(stationId: string) {
  return {
    endpoint: `/scan-stations/${stationId}/claim`,
    method: "POST" as const,
  };
}

export function releaseScanStationClaim(stationId: string) {
  return {
    endpoint: `/scan-stations/${stationId}/release-claim`,
    method: "POST" as const,
  };
}

export function deleteScanStation(stationId: string) {
  return {
    endpoint: `/scan-stations/${stationId}`,
    method: "DELETE" as const,
  };
}

export function startScanSession(stationId: string) {
  return {
    endpoint: `/scan-stations/${stationId}/sessions`,
    method: "POST" as const,
  };
}

export function readScanSession(stationId: string) {
  return generateUrl(`/scan-stations/${stationId}/sessions/current`);
}

export function endScanSession(stationId: string) {
  return {
    endpoint: `/scan-stations/${stationId}/sessions/current`,
    method: "DELETE" as const,
  };
}

export function removeScanSessionItem(stationId: string, isbn: string) {
  return {
    endpoint: `/scan-stations/${stationId}/sessions/current/items/${encodeURIComponent(isbn)}`,
    method: "DELETE" as const,
  };
}

export function resolveScanSession(stationId: string) {
  return {
    endpoint: `/scan-stations/${stationId}/sessions/current/resolve`,
    method: "POST" as const,
  };
}

/** Leave price out to import the book as a draft and price it later. */
export type ScanSessionImportOffer = {
  price?: string;
  stock: number;
  condition: string;
  signed?: boolean;
  currency?: string;
  description?: string;
};

export function importScanSession(
  stationId: string,
  body: {
    items: Array<{ isbn: string; offer: ScanSessionImportOffer }>;
  },
) {
  return {
    endpoint: `/scan-stations/${stationId}/sessions/current/import`,
    method: "POST" as const,
    body,
  };
}

export function resolveInventoryIsbn(isbn: string) {
  return {
    endpoint: "/seller-inventory/resolve-isbn",
    method: "POST" as const,
    body: { isbn },
  };
}

export type ScanEventScope = "user" | "station";

export function scanStationEventsPath(
  stationId: string,
  scope: ScanEventScope = "user",
) {
  return generateUrl(`/scan-stations/${stationId}/events`, { scope });
}
