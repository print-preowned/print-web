import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session-server";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ session });
}
