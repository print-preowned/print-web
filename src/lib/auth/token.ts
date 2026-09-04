/**
 * Token types and utilities following PRINT Authorization & Context Model
 * 
 * Token structure requirements:
 * - Required base fields: iss, aud, sub, iat, exp, jti, ctx
 * - Context: CUSTOMER or SELLER
 * - SELLER tokens require: privileges, seller.id, seller.is_owner
 */

export type TokenContext = "CUSTOMER" | "SELLER" | "PLATFORM";

export interface BaseTokenFields {
  iss: string; // Issuer
  aud: string; // Audience
  sub: string; // Subject (user ID)
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
  jti: string; // JWT ID (unique token identifier)
  ctx: TokenContext; // Context
}

export interface SellerTokenData {
  id: string;
  role: {
    id: string;
    name: string;
    is_system: boolean;
  };
  is_owner: boolean;
}

export interface CustomerToken extends BaseTokenFields {
  ctx: "CUSTOMER";
  /** Set at login/context-switch; true if user has a linked seller (can switch to SELLER). */
  has_seller?: boolean;
  // Customer tokens must NOT have: seller (object), privileges, role
}

export interface SellerToken extends BaseTokenFields {
  ctx: "SELLER";
  privileges: string[];
  seller: SellerTokenData;
}

export interface PlatformToken extends BaseTokenFields {
  ctx: "PLATFORM";
  privileges: string[];
  /** Set when seeded/bootstrap user must change password before platform access */
  pwd_chg?: boolean;
  // Platform tokens must NOT include: seller
}

export type AccessToken = CustomerToken | SellerToken | PlatformToken;

/**
 * Minimal session shape returned by /api/auth/me (only what the UI needs).
 * Exposes user id as `id` (from JWT sub); no iss, aud, iat, exp, jti.
 */
export interface Session {
  id: string;
  context: TokenContext;
  seller?: { id: string; is_owner: boolean };
  privileges?: string[];
  /** When context is CUSTOMER, true if the user has a linked seller (can switch). */
  hasSeller?: boolean;
  /** PLATFORM only: must change password before accessing admin resources */
  passwordChangeRequired?: boolean;
}

export function sessionFromToken(decoded: AccessToken): Session {
  const session: Session = {
    id: decoded.sub,
    context: decoded.ctx,
  };
  if (decoded.ctx === "SELLER" && "seller" in decoded) {
    session.seller = {
      id: decoded.seller.id,
      is_owner: decoded.seller.is_owner,
    };
    session.privileges = decoded.privileges;
  }
  if (decoded.ctx === "PLATFORM" && "privileges" in decoded) {
    session.privileges = decoded.privileges;
    session.passwordChangeRequired = decoded.pwd_chg === true;
  }
  if (decoded.ctx === "CUSTOMER" && "has_seller" in decoded) {
    session.hasSeller = decoded.has_seller === true;
  }
  return session;
}

/**
 * Decode and validate token structure
 */
export function decodeToken(token: string): AccessToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    
    // Validate required base fields
    const requiredFields: (keyof BaseTokenFields)[] = ["iss", "aud", "sub", "iat", "exp", "jti", "ctx"];
    for (const field of requiredFields) {
      if (!(field in payload)) {
        console.error(`Missing required token field: ${field}`);
        return null;
      }
    }

    // Validate context
    if (payload.ctx !== "CUSTOMER" && payload.ctx !== "SELLER" && payload.ctx !== "PLATFORM") {
      console.error(`Invalid token context: ${payload.ctx}`);
      return null;
    }

    // Validate SELLER token requirements
    if (payload.ctx === "SELLER") {
      if (!payload.seller) {
        console.error("SELLER token missing seller field");
        return null;
      }
      if (!payload.privileges || !Array.isArray(payload.privileges)) {
        console.error("SELLER token missing privileges field");
        return null;
      }
      if (!payload.seller.id || typeof payload.seller.is_owner !== "boolean") {
        console.error("SELLER token missing required seller fields");
        return null;
      }
    }

    // Validate PLATFORM token requirements
    if (payload.ctx === "PLATFORM") {
      if (payload.seller) {
        console.error("PLATFORM token must not have seller field");
        return null;
      }
      if (!payload.privileges || !Array.isArray(payload.privileges)) {
        console.error("PLATFORM token missing privileges field");
        return null;
      }
    }

    // Validate CUSTOMER token prohibitions
    if (payload.ctx === "CUSTOMER") {
      if (payload.seller || payload.privileges || payload.role) {
        console.error("CUSTOMER token contains forbidden fields");
        return null;
      }
    }

    // Check expiration
    if (payload.exp * 1000 < Date.now()) {
      console.error("Token has expired");
      return null;
    }

    return payload as AccessToken;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

/**
 * Check if token is valid and not expired
 */
export function isTokenValid(token: string): boolean {
  const decoded = decodeToken(token);
  return decoded !== null;
}

/**
 * Get token context
 */
export function getTokenContext(token: string): TokenContext | null {
  const decoded = decodeToken(token);
  return decoded?.ctx || null;
}

/**
 * Check if user has a specific privilege (SELLER or PLATFORM context)
 */
export function hasPrivilege(token: string, privilege: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || (decoded.ctx !== "SELLER" && decoded.ctx !== "PLATFORM")) {
    return false;
  }
  if (decoded.ctx === "SELLER" || decoded.ctx === "PLATFORM") {
    return decoded.privileges.includes(privilege);
  }
  return false;
}

/**
 * Check if user is owner (SELLER context only)
 */
export function isOwner(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || decoded.ctx !== "SELLER") {
    return false;
  }
  return decoded.seller.is_owner;
}

/**
 * Get business ID from token (SELLER context only)
 */
export function getSellerId(token: string): string | null {
  const decoded = decodeToken(token);
  if (!decoded || decoded.ctx !== "SELLER") {
    return null;
  }
  return decoded.seller.id;
}

