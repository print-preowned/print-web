import { PROFILE_COOKIE_NAME } from "@/lib/cookies";
import { User } from "../api/user";

export type UserProfileCookie = Record<string, unknown>;


export function readUserProfileCookie(): User | null {
  if (typeof document === "undefined") {
    return null;
  }

  const encoded = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${PROFILE_COOKIE_NAME}=`))
    ?.slice(PROFILE_COOKIE_NAME.length + 1);
  if (!encoded) return null;

  try {
    return JSON.parse(decodeURIComponent(encoded));
  } catch {
    return null;
  }
}

export function clearUserProfileCookie(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PROFILE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}