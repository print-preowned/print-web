export type LegalEntityStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type LegalEntity = {
  id: string;
  user_id: string;
  legal_name?: string | null;
  bvn?: string | null;
  cac_number?: string | null;
  status: LegalEntityStatus;
  created_at: string;
  updated_at: string;
};

export type LegalEntityPayload = {
  legal_name: string;
  bvn?: string;
  cac_number?: string;
};

export function readCurrentLegalEntity() {
  return "/legal-entities";
}

export function createLegalEntity(payload: LegalEntityPayload) {
  return {
    endpoint: "/legal-entities",
    method: "POST" as const,
    body: payload,
  };
}

export function updateLegalEntity(id: string, payload: LegalEntityPayload) {
  return {
    endpoint: `/legal-entities/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}
