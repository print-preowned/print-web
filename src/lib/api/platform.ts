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
  platform_privilege_set_name?: string;
  /** True when this user holds the singleton Super Admin privilege set */
  is_super_admin?: boolean;
}

export interface PlatformPrivilegeSet {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformPrivilege {
  id: string;
  code: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformPrivilegeSetPrivilege {
  id: string;
  privilege_set_id: string;
  privilege_code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePlatformPrivilegeSetRequest {
  name: string;
  status?: string;
}

export interface UpdatePlatformPrivilegeSetRequest {
  name?: string;
  status?: string;
}

export interface BaseResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

export interface PlatformInvite {
  id: string;
  email: string;
  platform_privilege_set_id: string;
  expires_at: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "REVOKED";
  invited_by: string;
  created_at: string;
  accepted_at?: string;
  /** Populated when reading platform invites list */
  platform_privilege_set_name?: string;
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
}

export interface CreateInviteResponse {
  invite_id: string;
  expires_at: string;
  message: string;
}

export interface ResendInviteRequest {
  platform_privilege_set_id?: string;
}

export interface UpdatePlatformUserRequest {
  platform_privilege_set_id?: string;
  status?: string;
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

/** Build URL for paginated platform privilege sets list (GET). */
export function readPlatformPrivilegeSetsUrl(params?: {
  page?: number;
  size?: number;
}) {
  const query: Record<string, number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.size != null) query.size = params.size;
  return generateUrl("/platform-privilege-set", query);
}

export function createPlatformPrivilegeSet(payload: CreatePlatformPrivilegeSetRequest) {
  return {
    endpoint: "/platform-privilege-set",
    method: "POST" as const,
    body: payload,
  };
}

export function updatePlatformPrivilegeSet(
  id: string,
  payload: UpdatePlatformPrivilegeSetRequest,
) {
  return {
    endpoint: `/platform-privilege-set/${id}`,
    method: "PUT" as const,
    body: payload,
  };
}

export function deletePlatformPrivilegeSet(id: string) {
  return { endpoint: `/platform-privilege-set/${id}`, method: "DELETE" as const };
}

export async function readPlatformPrivileges(params?: {
  page?: number;
  size?: number;
}) {
  return apiFetch<PaginatedResponse<PlatformPrivilege>>("/platform-privilege", {
    method: "GET",
    query: {
      page: params?.page || 1,
      size: params?.size || 100,
    },
  });
}

export async function readPrivilegeSetPrivileges(privilegeSetId: string) {
  return apiFetch<BaseResponse<PlatformPrivilegeSetPrivilege[]>>(
    `/platform-privilege-set-privilege/privilege-set/${privilegeSetId}`,
    { method: "GET" },
  );
}

export function createPrivilegeSetPrivilege(payload: {
  privilege_set_id: string;
  privilege_code: string;
  status?: string;
}) {
  return {
    endpoint: "/platform-privilege-set-privilege",
    method: "POST" as const,
    body: payload,
  };
}

export function deletePrivilegeSetPrivilege(id: string) {
  return {
    endpoint: `/platform-privilege-set-privilege/${id}`,
    method: "DELETE" as const,
  };
}

export function createPlatformInvite(payload: CreateInviteRequest) {
  return {
    endpoint: "/platform-invite/create",
    method: "POST" as const,
    body: payload,
  };
}

export function resendPlatformInvite(id: string, payload: ResendInviteRequest) {
  return {
    endpoint: `/platform-invite/${id}/resend`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function revokePlatformInvite(id: string) {
  return {
    endpoint: `/platform-invite/${id}/revoke`,
    method: "POST" as const,
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

export function updatePlatformUser(id: string, payload: UpdatePlatformUserRequest) {
  return {
    endpoint: `/platform-user/${id}`,
    method: "PUT" as const,
    body: payload,
  };
}

export interface SuperAdminTransferRequest {
  target_platform_user_id: string;
}

export interface PlatformUserMeResponse {
  status_code: number;
  message: string;
  data: PlatformUser;
}

export async function readPlatformUserMe() {
  return apiFetch<PlatformUserMeResponse>("/platform-user/me", { method: "GET" });
}

export function transferSuperAdmin(payload: SuperAdminTransferRequest) {
  return {
    endpoint: "/platform-user/transfer-super-admin",
    method: "POST" as const,
    body: payload,
  };
}
