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

export function readUserAddresses() {
  return generateUrl("/addresses");
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

export type BusinessAddress = {
  id: string;
  business_id: string;
  label: string;
  phone_number?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code?: string | null;
  country_code: string;
  is_primary: boolean;
  pickup_enabled: boolean;
};

export type BusinessAddressCreatePayload = {
  label: string;
  phone_number?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code?: string | null;
  country_code?: string;
  is_primary?: boolean;
  pickup_enabled?: boolean;
};

export type BusinessAddressUpdatePayload = Partial<BusinessAddressCreatePayload>;

export function readBusinessPickupLocation(businessId: string) {
  return generateUrl(`/businesses/${businessId}/pickup-location`);
}

export function readBusinessAddresses(params?: { page?: number; size?: number }) {
  return generateUrl("/business-addresses", params);
}

export function readBusinessAddressById(id: string) {
  return generateUrl(`/business-addresses/${id}`);
}

export function createBusinessAddress(payload: BusinessAddressCreatePayload) {
  return { endpoint: "/business-addresses", method: "POST" as const, body: payload };
}

export function updateBusinessAddress(id: string, payload: BusinessAddressUpdatePayload) {
  return { endpoint: `/business-addresses/${id}`, method: "PATCH" as const, body: payload };
}

export function deleteBusinessAddress(id: string) {
  return { endpoint: `/business-addresses/${id}`, method: "DELETE" as const };
}

export function setPrimaryBusinessAddress(id: string) {
  return { endpoint: `/business-addresses/${id}/set-primary`, method: "POST" as const };
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
