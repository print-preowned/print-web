import { User } from "./user";

export interface Login {
  email: string;
  password: string;
}

export interface Signup {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  status_code: number;
  message: string;
  data: User;
  token: string;
}

export function login(payload: Login) {
  return { endpoint: "/auth/login", method: "POST", body: payload };
}

export function signup(payload: Signup) {
  return { endpoint: "/auth/signup", method: "POST", body: payload };
}

export function platformLogin(payload: Login) {
  return { endpoint: "/admin/users/login", method: "POST", body: payload };
}

export interface ContextSwitchResponse {
  status_code: number;
  message: string;
  token: string;
}

export function switchToBusiness(businessId: string) {
  return {
    endpoint: `/auth/context/business/${businessId}`,
    method: "POST" as const,
    body: {},
  };
}

export function switchToCustomer() {
  return {
    endpoint: "/auth/context/customer",
    method: "POST" as const,
    body: {},
  };
}
