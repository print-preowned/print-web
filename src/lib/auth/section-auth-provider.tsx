import type { ReactNode } from "react";
import { AuthProvider } from "./context";
import { getSessionFromRequest } from "./session-server";
import type { Section } from "../sections";

/**
 * Server wrapper for a section layout: verifies the section's session once on
 * the server and hands it to the client provider, so pages don't flash
 * signed-out while /api/auth/me loads.
 */
export async function SectionAuthProvider({
  section,
  children,
}: {
  section: Section;
  children: ReactNode;
}) {
  const session = await getSessionFromRequest();
  return (
    <AuthProvider section={section} initialSession={session}>
      {children}
    </AuthProvider>
  );
}
