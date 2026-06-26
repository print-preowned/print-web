/**
 * Server-only session builder. Use in API routes and server components.
 * Session is derived from the JWT only (hasBusiness is set at login/context-switch on the backend).
 */

import { getAuthTokenFromRequest } from "./server-cookie";
import { decodeToken, sessionFromToken, type Session } from "./token";

export async function getSessionFromRequest(): Promise<Session | null> {
  const token = await getAuthTokenFromRequest();
  if (!token) return null;
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return sessionFromToken(decoded);
}
