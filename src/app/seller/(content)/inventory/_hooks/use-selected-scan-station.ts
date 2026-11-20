"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { scanStationKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { listScanStations, type ScanStation } from "@/app/seller/lib/api/scan-station";
import type { BaseResponse } from "@/lib/model";

const STORAGE_KEY = "print.seller.scanStationId";

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(id: string | null) {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked; selection just won't survive a reload.
  }
}

/**
 * The seller's stations plus the one this browser is scanning with. Shared by
 * the inventory page and the batch page so both talk about the same scanner.
 */
export function useSelectedScanStation() {
  const query = useApiQuery<BaseResponse<ScanStation[]>>(
    scanStationKeys.all,
    listScanStations(),
  );
  const stations = useMemo(() => query.data?.data ?? [], [query.data]);
  const [stationId, setStationIdState] = useState<string | null>(null);

  const setStationId = useCallback((id: string | null) => {
    setStationIdState(id);
    writeStored(id);
  }, []);

  useEffect(() => {
    if (!query.isSuccess) return;
    if (stationId && stations.some((row) => row.id === stationId)) return;
    const stored = readStored();
    const next = stations.find((row) => row.id === stored) ?? stations[0] ?? null;
    setStationId(next?.id ?? null);
  }, [query.isSuccess, stations, stationId, setStationId]);

  const station = stations.find((row) => row.id === stationId) ?? null;

  return {
    stations,
    station,
    stationId,
    setStationId,
    isLoading: query.isLoading,
  };
}
