import { User } from "./user";
import type { BaseResponse } from "@/lib/model";

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

export type LoginResponse = BaseResponse<User> & {
  token: string;
}

export function login(payload: Login) {
  return { endpoint: "/auth/login", method: "POST" as const, body: payload };
}

export function signup(payload: Signup) {
  return { endpoint: "/auth/signup", method: "POST" as const, body: payload };
}
