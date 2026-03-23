import type { Metadata } from "next";
import localFont from "next/font/local";
import HashScrollHandler from "@/components/HashScrollHandler";
import Navbar from "@/components/Navbar";
import "./globals.css";

const simsun = localFont({
  src: "../public/font/SIMSUN.ttf",
  variable: "--font-simsun",
});

export const metadata: Metadata = {
  title: "Aidan Honor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${simsun.variable} h-full`}>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-simsun), serif" }}
      >
        <HashScrollHandler />
        <div className="app-scroll">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
