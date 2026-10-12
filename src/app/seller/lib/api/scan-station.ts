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

export type ScanSession = {
  id: string;
  station_id: string;
  isbns: string[];
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
  error: string | null;
};

export type ScanEvent = {
  type: "scan" | "session_item";
  isbn: string;
  station_id: string;
  seller_id: string;
  session_id?: string;
  added?: boolean;
  count?: number;
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

export function resolveScanSession(stationId: string) {
  return {
    endpoint: `/scan-stations/${stationId}/sessions/current/resolve`,
    method: "POST" as const,
  };
}

export function importScanSession(
  stationId: string,
  body: {
    offer: {
      price: string;
      stock: number;
      condition: string;
      signed?: boolean;
      currency?: string;
      description?: string;
    };
    isbns?: string[];
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

export function scanStationEventsPath(stationId: string) {
  return generateUrl(`/scan-stations/${stationId}/events`);
}
