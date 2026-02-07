import { apiFetch, generateUrl } from ".";

export interface PlatformUser {
  id: string;
  user_id: string;
  platform_privilege_set_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  /** Populated when reading platform users list */
  user_email?: string;
  user_name?: string;
}

export interface PlatformPrivilegeSet {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformInvite {
  id: string;
  email: string;
  platform_privilege_set_id: string;
  expires_at: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  invited_by: string;
  created_at: string;
  accepted_at?: string;
}

export interface PaginatedResponse<T> {
  status_code: number;
  message: string;
  data: T[];
  pagination: {
    page: number;
    size: number;
    total_pages: number;
    total_results: number;
  };
}

export interface CreateInviteRequest {
  email: string;
  platform_privilege_set_id: string;
  expires_in_days?: number;
}

export interface CreateInviteResponse {
  invite_id: string;
  token: string; // Only for development - should be sent via email
  expires_at: string;
}

export interface ValidateInviteResponse {
  valid: boolean;
  invite: PlatformInvite | null;
  message: string | null;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

export interface RejectInviteRequest {
  token: string;
}

export async function readPlatformPrivilegeSets(params?: {
  page?: number;
  size?: number;
  search?: string;
}) {
  return apiFetch<PaginatedResponse<PlatformPrivilegeSet>>(
    "/platform-privilege-set",
    {
      method: "GET",
      query: {
        page: params?.page || 1,
        size: params?.size || 100,
        ...(params?.search && { search: params.search }),
      },
    }
  );
}

export function createPlatformInvite(payload: CreateInviteRequest) {
  return {
    endpoint: "/platform-invite/create",
    method: "POST" as const,
    body: payload,
  };
}

export async function validatePlatformInvite(token: string) {
  return apiFetch<ValidateInviteResponse>(
    "/platform-invite/validate",
    {
      method: "GET",
      query: { token },
    }
  );
}

export function acceptPlatformInvite(payload: AcceptInviteRequest) {
  return {
    endpoint: "/platform-invite/accept",
    method: "POST" as const,
    body: payload,
  };
}

export function rejectPlatformInvite(payload: RejectInviteRequest) {
  return {
    endpoint: "/platform-invite/reject",
    method: "POST" as const,
    body: payload,
  };
}

/** Build URL for paginated platform users list (GET). */
export function readPlatformUsers(params?: { page?: number; size?: number }) {
  const query: Record<string, number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.size != null) query.size = params.size;
  return generateUrl("/platform-user", query);
}

/** Build URL for paginated platform invites list (GET). */
export function readPlatformInvites(params?: { page?: number; size?: number }) {
  const query: Record<string, number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.size != null) query.size = params.size;
  return generateUrl("/platform-invite", query);
}

export function deletePlatformUser(id: string) {
  return { endpoint: `/platform-user/${id}`, method: "DELETE" as const };
}
