import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-shell";
import { SectionAuthProvider } from "@/lib/auth/section-auth-provider";
import { SECTION_NAME } from "@/lib/sections";

export default function StoreAuthLayout({ children }: { children: ReactNode }) {
  return (
    <SectionAuthProvider section="store">
      <AuthShell title={SECTION_NAME.store}>{children}</AuthShell>
    </SectionAuthProvider>
  );
}
