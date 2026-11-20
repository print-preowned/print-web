import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-shell";
import { SectionAuthProvider } from "@/lib/auth/section-auth-provider";
import { SECTION_NAME } from "@/lib/sections";

export default function SellerAuthLayout({ children }: { children: ReactNode }) {
  return (
    <SectionAuthProvider section="seller">
      <AuthShell title={SECTION_NAME.seller}>{children}</AuthShell>
    </SectionAuthProvider>
  );
}
