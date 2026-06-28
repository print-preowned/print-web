/**
 * Token types and utilities following PRINT Authorization & Context Model
 * 
 * Token structure requirements:
 * - Required base fields: iss, aud, sub, iat, exp, jti, ctx
 * - Context: CUSTOMER or BUSINESS
 * - BUSINESS tokens require: business.id, business.privileges, business.is_owner
 */

export type TokenContext = "CUSTOMER" | "BUSINESS" | "PLATFORM";

export interface BaseTokenFields {
  iss: string; // Issuer
  aud: string; // Audience
  sub: string; // Subject (user ID)
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
  jti: string; // JWT ID (unique token identifier)
  ctx: TokenContext; // Context
}

export interface BusinessTokenData {
  id: string;
  role: {
    id: string;
    name: string;
    is_system: boolean;
  };
  is_owner: boolean;
  privileges: string[];
}

export interface CustomerToken extends BaseTokenFields {
  ctx: "CUSTOMER";
  /** Set at login/context-switch; true if user has a linked business (can switch to BUSINESS). */
  has_business?: boolean;
  // Customer tokens must NOT have: business (object), privileges, role
}

export interface BusinessToken extends BaseTokenFields {
  ctx: "BUSINESS";
  business: BusinessTokenData;
}

export interface PlatformToken extends BaseTokenFields {
  ctx: "PLATFORM";
  privileges: string[];
  /** Set when seeded/bootstrap user must change password before platform access */
  pwd_chg?: boolean;
  // Platform tokens must NOT include: business
}

export type AccessToken = CustomerToken | BusinessToken | PlatformToken;

/**
 * Minimal session shape returned by /api/auth/me (only what the UI needs).
 * Exposes user id as `id` (from JWT sub); no iss, aud, iat, exp, jti.
 */
export interface Session {
  id: string;
  context: TokenContext;
  business?: { id: string; privileges: string[]; is_owner: boolean };
  privileges?: string[];
  /** When context is CUSTOMER, true if the user has a linked business (can switch). */
  hasBusiness?: boolean;
  /** PLATFORM only: must change password before accessing admin resources */
  passwordChangeRequired?: boolean;
}

export function sessionFromToken(decoded: AccessToken): Session {
  const session: Session = {
    id: decoded.sub,
    context: decoded.ctx,
  };
  if (decoded.ctx === "BUSINESS" && "business" in decoded) {
    session.business = {
      id: decoded.business.id,
      privileges: decoded.business.privileges,
      is_owner: decoded.business.is_owner,
    };
  }
  if (decoded.ctx === "PLATFORM" && "privileges" in decoded) {
    session.privileges = decoded.privileges;
    session.passwordChangeRequired = decoded.pwd_chg === true;
  }
  if (decoded.ctx === "CUSTOMER" && "has_business" in decoded) {
    session.hasBusiness = decoded.has_business === true;
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
    if (payload.ctx !== "CUSTOMER" && payload.ctx !== "BUSINESS" && payload.ctx !== "PLATFORM") {
      console.error(`Invalid token context: ${payload.ctx}`);
      return null;
    }

    // Validate BUSINESS token requirements
    if (payload.ctx === "BUSINESS") {
      if (!payload.business) {
        console.error("BUSINESS token missing business field");
        return null;
      }
      if (!payload.business.id || !payload.business.privileges || typeof payload.business.is_owner !== "boolean") {
        console.error("BUSINESS token missing required business fields");
        return null;
      }
    }

    // Validate PLATFORM token requirements
    if (payload.ctx === "PLATFORM") {
      if (payload.business) {
        console.error("PLATFORM token must not have business field");
        return null;
      }
      if (!payload.privileges || !Array.isArray(payload.privileges)) {
        console.error("PLATFORM token missing privileges field");
        return null;
      }
    }

    // Validate CUSTOMER token prohibitions
    if (payload.ctx === "CUSTOMER") {
      if (payload.business || payload.privileges || payload.role) {
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
 * Check if user has a specific privilege (BUSINESS or PLATFORM context)
 */
export function hasPrivilege(token: string, privilege: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || (decoded.ctx !== "BUSINESS" && decoded.ctx !== "PLATFORM")) {
    return false;
  }
  if (decoded.ctx === "BUSINESS") {
    return decoded.business.privileges.includes(privilege);
  } else {
    return decoded.privileges.includes(privilege);
  }
}

/**
 * Check if user is owner (BUSINESS context only)
 */
export function isOwner(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || decoded.ctx !== "BUSINESS") {
    return false;
  }
  return decoded.business.is_owner;
}

/**
 * Get business ID from token (BUSINESS context only)
 */
export function getBusinessId(token: string): string | null {
  const decoded = decodeToken(token);
  if (!decoded || decoded.ctx !== "BUSINESS") {
    return null;
  }
  return decoded.business.id;
}

