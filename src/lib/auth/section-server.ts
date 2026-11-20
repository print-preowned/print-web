import { headers } from "next/headers";
import { isSection, SECTION_HEADER, type Section } from "../sections";

/**
 * The section of the current request, as the middleware resolved it. Returns
 * null if the header is missing (the middleware did not run), so callers fail
 * closed and treat the request as signed out.
 */
export async function getSection(): Promise<Section | null> {
  const value = (await headers()).get(SECTION_HEADER);
  return isSection(value) ? value : null;
}
