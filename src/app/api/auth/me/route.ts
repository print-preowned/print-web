import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session-server";
import {
  clearAuthCookie,
  getAuthTokenFromRequest,
} from "@/lib/auth/server-cookie";

export async function GET() {
  const token = await getAuthTokenFromRequest();
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const session = await getSessionFromRequest();
  if (!session) {
    await clearAuthCookie();
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ session });
}
