/** A store's team: its members and the invitations it has sent. */

export type SellerMember = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  role_name: string;
  is_owner: boolean;
  status: string;
  created_at: string;
};

export type SellerInvite = {
  id: string;
  email: string;
  role_id: string;
  role_name: string;
  invited_by_name: string;
  expires_at: string;
  created_at: string;
};

/** What an invite link shows before anyone signs in. */
export type SellerInviteLookup = {
  seller_id: string;
  seller_name: string;
  role_name: string;
  email: string;
  invited_by_name: string;
  expires_at: string;
  has_account: boolean;
};

export const readMembers = () => "/seller-users";

export function changeMemberRole(id: string, roleId: string) {
  return { endpoint: `/seller-users/${id}`, method: "PATCH" as const, body: { role_id: roleId } };
}

export function removeMember(id: string) {
  return { endpoint: `/seller-users/${id}`, method: "DELETE" as const };
}

export const readInvites = () => "/seller-invites";

export function createInvite(payload: { email: string; role_id: string }) {
  return { endpoint: "/seller-invites", method: "POST" as const, body: payload };
}

export function resendInvite(id: string) {
  return { endpoint: `/seller-invites/${id}/resend`, method: "POST" as const };
}

export function revokeInvite(id: string) {
  return { endpoint: `/seller-invites/${id}`, method: "DELETE" as const };
}

// The invite token goes in the body, never the URL, so it stays out of server logs.

export function lookupInvite(token: string) {
  return { endpoint: "/seller-invites/lookup", method: "POST" as const, body: { token } };
}

export function acceptInvite(token: string) {
  return { endpoint: "/seller-invites/accept", method: "POST" as const, body: { token } };
}

export function declineInvite(token: string) {
  return { endpoint: "/seller-invites/decline", method: "POST" as const, body: { token } };
}

export function registerFromInvite(payload: {
  token: string;
  first_name: string;
  last_name: string;
  password: string;
}) {
  return { endpoint: "/seller-invites/register", method: "POST" as const, body: payload };
}
