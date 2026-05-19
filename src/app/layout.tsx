import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AROET Service",
  description: "A&R Optical field service tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
