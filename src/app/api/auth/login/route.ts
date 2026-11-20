import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { getSection } from "@/lib/auth/section-server";
import { applyAuthCookie, applyUserProfileCookie } from "@/lib/auth/server-cookie";
import { SELLER_SELECT_COOKIE, sellerSelectCookieOptions } from "@/lib/auth/seller-select";
import type { Section } from "@/lib/sections";

/** Each section signs in against its own API endpoint, on its own host. */
const LOGIN_ENDPOINT: Record<Section, string> = {
  store: "/auth/login",
  seller: "/seller/auth/login",
  admin: "/admin/auth/login",
};

type LoginResult = {
  statusCode: number;
  message: string;
  data: unknown;
  token?: string | null;
  // Seller sign-in with several stores: pick one with the ticket.
  stores?: { id: string; name: string; logo?: string | null }[] | null;
  selectionTicket?: string | null;
};

export async function POST(request: NextRequest) {
  const section = await getSection();
  if (!section) {
    return NextResponse.json({ detail: "Unknown section" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const res = await backendFetch<LoginResult>(LOGIN_ENDPOINT[section], {
      method: "POST",
      body,
    });

    if (section === "seller" && !res.token && res.stores && res.selectionTicket) {
      // Keep the ticket out of page JS; /api/auth/select-store reads it from here.
      const response = NextResponse.json({ stores: res.stores, data: res.data });
      response.cookies.set(
        SELLER_SELECT_COOKIE,
        res.selectionTicket,
        sellerSelectCookieOptions(request),
      );
      applyUserProfileCookie(response, res.data, request);
      return response;
    }

    if (!res.token) {
      return NextResponse.json({ detail: "No token in response" }, { status: 500 });
    }
    const response = NextResponse.json({
      statusCode: res.statusCode,
      message: res.message,
      data: res.data,
    });
    applyUserProfileCookie(response, res.data, request);
    return applyAuthCookie(response, res.token, request);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
