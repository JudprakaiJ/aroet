import type { Metadata } from "next";
import TopNav from "@/components/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "AROET Service",
  description: "A&R Optical field service tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white">
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
