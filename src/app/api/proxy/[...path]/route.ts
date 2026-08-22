import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/api/core";
import { getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

const UPSTREAM_TIMEOUT_MS = 30_000;

/** Sent upstream. `Cookie` is absent by design: it is swapped for a bearer token. */
const FORWARDED_REQUEST_HEADERS = ["accept", "accept-language", "content-type"];

/**
 * Dropped on the way back. The backend is trusted, so everything else passes.
 * `Content-Encoding` / `Content-Length` describe the encoded body `fetch`
 * already decoded. `Set-Cookie` would be stored against this origin, and Next
 * owns the auth cookie. The rest are hop-by-hop (RFC 9110).
 */
const BLOCKED_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length",
  "set-cookie",
]);

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
  const pathStr = path.join("/").replace(/^\/+/, "");
  const token = await getAuthTokenFromRequest();

  // Next decodes catch-all segments, so this string can be anything a caller
  // encoded. buildBackendUrl rejects absolute input, which is what keeps the
  // bearer token from going offsite.
  let url: URL;
  try {
    url = new URL(buildBackendUrl(pathStr));
  } catch {
    return NextResponse.json({ detail: "Invalid proxy path" }, { status: 400 });
  }
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  let body: ArrayBuffer | undefined;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      // Bytes, not text: multipart and other binary payloads have to survive
      // the hop unchanged.
      body = await request.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      // Never chase a backend 3xx: following it would replay the bearer token
      // against whatever origin the Location points at.
      redirect: "manual",
      signal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      ]),
    });
  } catch (err) {
    if (request.signal.aborted) {
      return new NextResponse(null, { status: 499 });
    }
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      { detail: timedOut ? "Upstream timed out" : "Upstream unavailable" },
      { status: timedOut ? 504 : 502 }
    );
  }

  const responseHeaders = forwardResponseHeaders(res.headers);

  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return new NextResponse(null, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  }

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

function forwardResponseHeaders(source: Headers): Headers {
  const blocked = new Set(BLOCKED_RESPONSE_HEADERS);
  const forwarded = new Headers();

  source.forEach((value, name) => {
    if (!blocked.has(name.toLowerCase())) {
      forwarded.set(name, value);
    }
  });
  return forwarded;
}
