import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard finansowy",
  description: "Aplikacja do zarządzania budżetem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${inter.className} antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
