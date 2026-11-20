import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { getSection } from "@/lib/auth/section-server";
import { applyAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

/** Move the seller session to another of the person's stores. */
export async function POST(request: NextRequest) {
  if ((await getSection()) !== "seller") {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  const token = await getAuthTokenFromRequest();
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  try {
    const { sellerId } = (await request.json()) as { sellerId?: string };
    if (!sellerId) {
      return NextResponse.json({ detail: "sellerId required" }, { status: 400 });
    }
    const res = await backendFetch<{ token: string }>(
      `/seller/auth/switch/${encodeURIComponent(sellerId)}`,
      { method: "POST", token },
    );
    return applyAuthCookie(NextResponse.json({ message: "Switched" }), res.token, request);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Couldn't switch store" }, { status: 500 });
  }
}
