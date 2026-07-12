import { generateUrl } from ".";

export type RolePrivilege = {
  id: string;
  role_id: string;
  privilege_code: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function readRolePrivilegesByRole(roleId: string) {
  return generateUrl(`/roles/${roleId}/privileges`);
}

export function readRolesByPrivilege(privilegeCode: string) {
  return generateUrl(`/privileges/${privilegeCode}/roles`);
}

export function createRolePrivilege(roleId: string, payload: { privilege_codes: string[] }) {
  return {
    endpoint: `/roles/${roleId}/privileges`,
    method: "POST" as const,
    body: payload,
  };
}

export function deleteRolePrivilege(roleId: string, privilegeCode: string) {
  return {
    endpoint: `/roles/${roleId}/privileges/${privilegeCode}`,
    method: "DELETE" as const,
  };
}
