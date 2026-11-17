import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import {
  applyClearAuthCookie,
  getAuthTokenFromRequest,
} from "@/lib/auth/server-cookie";

/** Ends the session on the API as well as clearing the cookie, so a copied token stops working too. */
export async function POST(request: Request) {
  const token = await getAuthTokenFromRequest();
  if (token) {
    try {
      await backendFetch("/auth/logout", { method: "POST", token });
    } catch {
      // Clearing the cookie still logs this device out.
    }
  }

  const response = NextResponse.json({ message: "Logged out" });
  return applyClearAuthCookie(response, request);
}
