import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { getSection } from "@/lib/auth/section-server";
import { applyClearAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

type RouteContext = { params: Promise<{ id: string }> };

/** Closing a store ends its seller sessions, including this one. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const section = await getSection();
  const token = await getAuthTokenFromRequest();
  if (!token || section !== "seller") {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await backendFetch(`/sellers/${encodeURIComponent(id)}`, { method: "DELETE", token });
    return applyClearAuthCookie(NextResponse.json({ message: "Deleted" }), request);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Request failed" }, { status: 500 });
  }
}
