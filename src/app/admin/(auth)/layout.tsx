import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-shell";
import { SectionAuthProvider } from "@/lib/auth/section-auth-provider";
import { SECTION_NAME } from "@/lib/sections";

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <SectionAuthProvider section="admin">
      <AuthShell title={SECTION_NAME.admin}>{children}</AuthShell>
    </SectionAuthProvider>
  );
}
