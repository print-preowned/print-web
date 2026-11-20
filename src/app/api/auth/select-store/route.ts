import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { getSection } from "@/lib/auth/section-server";
import { applyAuthCookie } from "@/lib/auth/server-cookie";
import { SELLER_SELECT_COOKIE, sellerSelectCookieOptions } from "@/lib/auth/seller-select";

/** Second step of seller sign-in for someone on several stores. */
export async function POST(request: NextRequest) {
  if ((await getSection()) !== "seller") {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  const ticket = request.cookies.get(SELLER_SELECT_COOKIE)?.value;
  if (!ticket) {
    return NextResponse.json({ detail: "Please sign in again." }, { status: 401 });
  }
  try {
    const { sellerId } = (await request.json()) as { sellerId?: string };
    const res = await backendFetch<{ token: string }>("/seller/auth/select", {
      method: "POST",
      body: { selectionTicket: ticket, sellerId },
    });
    const response = NextResponse.json({ message: "Signed in" });
    // The ticket is single-use on the API either way.
    response.cookies.set(SELLER_SELECT_COOKIE, "", sellerSelectCookieOptions(request, 0));
    return applyAuthCookie(response, res.token, request);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Couldn't open the store" }, { status: 500 });
  }
}
