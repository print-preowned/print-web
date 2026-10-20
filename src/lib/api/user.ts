import { generateUrl } from ".";

export type User = {
  id: string;
  roleId?: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  email: string;
  profileImage?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  statusCode: number;
  message: string;
  data: T[];
  pagination?: {
    page: number;
    size: number;
    totalPages: number;
    totalResults: number;
  } | null;
};

export function readUsers(params?: { page?: number; size?: number; search?: string }) {
  return generateUrl("/users", params);
}

export async function createUser(payload: {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  email: string;
  profileImage?: string | null;
  password: string;
  status?: string;
}) {
  return { endpoint: "/users", method: "POST" as const, body: payload };
}

export async function updateUser(
  id: string,
  payload: Partial<Omit<User, "id" | "createdAt" | "updatedAt">> & { password?: string },
) {
  return { endpoint: `/users/${id}`, method: "PATCH", body: payload };
}

export async function deleteUser(id: string) {
  return { endpoint: `/users/${id}`, method: "DELETE" };
}
