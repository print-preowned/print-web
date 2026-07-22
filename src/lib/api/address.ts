import { generateUrl } from ".";

export type UserAddress = {
  id: string;
  user_id: string;
  label?: string | null;
  recipient_name: string;
  phone_number?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code?: string | null;
  country_code: string;
  is_default: boolean;
};

export type UserAddressCreatePayload = {
  label?: string | null;
  recipient_name: string;
  phone_number?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code?: string | null;
  country_code?: string;
  is_default?: boolean;
};

export type UserAddressUpdatePayload = Partial<UserAddressCreatePayload>;

export function readUserAddresses(params?: { page?: number; size?: number }) {
  return generateUrl("/addresses", params);
}

export function readUserAddressById(id: string) {
  return generateUrl(`/addresses/${id}`);
}

export function createUserAddress(payload: UserAddressCreatePayload) {
  return { endpoint: "/addresses", method: "POST" as const, body: payload };
}

export function updateUserAddress(id: string, payload: UserAddressUpdatePayload) {
  return { endpoint: `/addresses/${id}`, method: "PATCH" as const, body: payload };
}

export function deleteUserAddress(id: string) {
  return { endpoint: `/addresses/${id}`, method: "DELETE" as const };
}

export function setDefaultUserAddress(id: string) {
  return { endpoint: `/addresses/${id}/set-default`, method: "POST" as const };
}

export function formatAddressLine(
  address: Pick<UserAddress, "line1" | "line2" | "city" | "state" | "postal_code">,
) {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
  ].filter(Boolean);
  return parts.join(", ");
}
