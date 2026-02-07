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

export type PlatformSignup = Signup & { platform_privilege_set_id: string };

export interface LoginResponse {
  status_code: number;
  message: string;
  data: User;
  token: string;
}

export function login(payload: Login) {
  return { endpoint: "/user/login", method: "POST", body: payload };
}

export function signup(payload: Signup) {
  return { endpoint: "/user/signup", method: "POST", body: payload };
}

export function platformLogin(payload: Login) {
  return { endpoint: "/platform-user/login", method: "POST", body: payload };
}

export function platformSignup(payload: PlatformSignup) {
  return { endpoint: "/platform-user/signup", method: "POST", body: payload };
}

export interface ContextSwitchRequest {
  target_context: "CUSTOMER" | "BUSINESS";
}

export interface ContextSwitchResponse {
  status_code: number;
  message: string;
  token: string;
}

export function switchContext(targetContext: "CUSTOMER" | "BUSINESS") {
  return {
    endpoint: "/user/context/switch",
    method: "POST" as const,
    body: { target_context: targetContext },
  };
}
