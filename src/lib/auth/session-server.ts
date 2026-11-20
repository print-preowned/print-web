/**
 * Server-only session builder. Use in API routes and server components.
 * The token is verified (signature, audience, and that it belongs to this
 * request's section) before anything is read from it.
 */

import { getSection } from "./section-server";
import { getAuthTokenFromRequest } from "./server-cookie";
import { sessionFromToken, type AccessToken, type Session } from "./token";
import { verifyAccessToken } from "./verify";
import { SECTION_CONTEXT } from "../sections";

export async function getSessionFromRequest(): Promise<Session | null> {
  const section = await getSection();
  const token = await getAuthTokenFromRequest();
  if (!section || !token) return null;
  const verified = await verifyAccessToken(token, SECTION_CONTEXT[section]);
  if (!verified) return null;
  return sessionFromToken(verified as unknown as AccessToken);
}
