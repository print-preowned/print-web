import { ReactNode } from "react";
import { Header } from "@/app/(customer)/header/index";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="container mx-auto">
        {children}
      </div>
    </>
  );
}

