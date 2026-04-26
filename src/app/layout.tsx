import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Softball Lineup Generator",
  description: "Co-ed softball lineup and position fairness app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b border-zinc-100">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              Seasons
            </Link>
            <Link
              href="/players"
              className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              Players
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
