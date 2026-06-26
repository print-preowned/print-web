import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, params, "PUT");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, params, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, params, "DELETE");
}

async function proxy(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const token = await getAuthTokenFromRequest();

  const url = new URL(`${API_BASE_URL}/${pathStr}`);
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let body: string | undefined;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body || undefined,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    statusText: res.statusText,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
    },
  });
}
