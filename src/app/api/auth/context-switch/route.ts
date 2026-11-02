import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { applyAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

export async function POST(request: Request) {
  try {
    const token = await getAuthTokenFromRequest();
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const targetContext = body?.targetContext as string | undefined;
    const sellerId = body?.seller_id as string | undefined;
    const grantId = body?.grant_id as string | undefined;

    let path: string;
    if (targetContext === "SELLER") {
      if (!sellerId) {
        return NextResponse.json({ detail: "seller_id required" }, { status: 400 });
      }
      path = `/auth/context/seller/${sellerId}`;
    } else if (targetContext === "CUSTOMER") {
      path = "/auth/context/customer";
    } else if (targetContext === "ONBOARDING") {
      // Platform staff entering a store the seller granted onboarding access to.
      if (!grantId) {
        return NextResponse.json({ detail: "grant_id required" }, { status: 400 });
      }
      path = `/seller-access-grants/${grantId}/enter`;
    } else if (targetContext === "PLATFORM") {
      // Back to admin from an onboarding session.
      path = "/auth/context/platform";
    } else {
      return NextResponse.json({ detail: "Invalid targetContext" }, { status: 400 });
    }

    const res = await backendFetch<{ statusCode: number; message: string; token: string }>(
      path,
      { method: "POST", body: {}, token },
    );
    if (!res.token) {
      return NextResponse.json({ detail: "No token in response" }, { status: 500 });
    }
    const response = NextResponse.json({
      statusCode: res.statusCode,
      message: res.message,
    });
    return applyAuthCookie(response, res.token, request);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Context switch failed" }, { status: 500 });
  }
}
