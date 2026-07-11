import { apiFetch, generateUrl } from ".";

export type User = {
  _id: string;
  role_id?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  email: string;
  profile_image?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  status_code: number;
  message: string;
  data: T[];
  pagination?: {
    page: number;
    size: number;
    total_pages: number;
    total_results: number;
  } | null;
};

export function readUsers(params?: { page?: number; size?: number; search?: string }) {
  return generateUrl("/users", params);
}

export async function createUser(payload: {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  email: string;
  profile_image?: string | null;
  password: string;
  status?: string;
}) {
  return { endpoint: "/users", method: "POST" as const, body: payload };
}

export async function updateUser(
  id: string,
  payload: Partial<Omit<User, "_id" | "created_at" | "updated_at">> & { password?: string },
) {
  return { endpoint: `/users/${id}`, method: "PATCH", body: payload };
}

export async function deleteUser(id: string) {
  return { endpoint: `/users/${id}`, method: "DELETE" };
}
