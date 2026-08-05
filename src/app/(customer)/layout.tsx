import { ReactNode } from "react";
import type { Metadata } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";
import { Header } from "@/app/(customer)/header/index";
import { Footer } from "@/app/(customer)/footer";
import "./storefront.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-storefront-display",
  weight: ["400", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-storefront-sans",
});

export const metadata: Metadata = {
  title: "PRINT",
  description: "Discover and buy books from independent sellers.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={`storefront ${libreBaskerville.variable} ${dmSans.variable}`}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
