import { NextResponse } from "next/server";
import { applyClearAuthCookie } from "@/lib/auth/server-cookie";

export async function POST(request: Request) {
  const response = NextResponse.json({ message: "Logged out" });
  return applyClearAuthCookie(response, request);
}
