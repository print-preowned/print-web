import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/server-cookie";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ message: "Logged out" });
}
