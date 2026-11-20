import { jwtVerify } from "jose";
import { getJwtSecretKey } from "./jwt-secret";
import type { TokenContext } from "./token";

/**
 * Each UI section has its own token audience, and a token's context must be
 * the one that section issues. Mirrors SECTION_AUDIENCE in the API.
 */
export const CONTEXT_AUDIENCE: Record<TokenContext, string> = {
  CUSTOMER: "print-store",
  SELLER: "print-seller",
  PLATFORM: "print-admin",
};

const AUDIENCE_CONTEXT = Object.fromEntries(
  Object.entries(CONTEXT_AUDIENCE).map(([ctx, aud]) => [aud, ctx as TokenContext]),
) as Record<string, TokenContext>;

export interface VerifiedPayload {
  sub?: string;
  ctx?: TokenContext;
  exp?: number;
  pwd_chg?: boolean;
  seller?: { id?: string; is_owner?: boolean; grant_id?: string };
  privileges?: string[];
  has_seller?: boolean;
}

/**
 * Verify a token's signature, issuer and audience, and that its context matches
 * its audience. Pass `context` to also require one particular section.
 * Returns null on any failure. Works on the edge runtime.
 */
export async function verifyAccessToken(
  token: string,
  context?: TokenContext,
): Promise<VerifiedPayload | null> {
  try {
    const audience = context ? CONTEXT_AUDIENCE[context] : Object.keys(AUDIENCE_CONTEXT);
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      audience,
      issuer: "print-api",
      algorithms: ["HS256"],
    });
    const aud = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
    if (!aud || AUDIENCE_CONTEXT[aud] !== payload.ctx) return null;
    return payload as unknown as VerifiedPayload;
  } catch {
    return null;
  }
}
