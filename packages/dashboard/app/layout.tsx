import Link from "next/link";
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Elevated Movements • EM AI Agents',
  description: 'Run EM AI agents from a Goblin.tools inspired gallery.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#03040a] text-white antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1f3c40_0%,#03040a_55%)]">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <header className="mb-10 flex flex-wrap items-center justify-between gap-4 text-sm text-white/80">
              <Link href="/" className="font-semibold text-white">
                Elevated Movements
              </Link>
              <nav className="flex flex-wrap items-center gap-4">
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
                <Link href="/programs" className="hover:text-white">
                  Programs &amp; Services
                </Link>
                <Link href="/corporate" className="hover:text-white">
                  Corporate Partnerships
                </Link>
                <Link href="/community" className="hover:text-white">
                  Community
                </Link>
                <Link href="/book-a-call" className="hover:text-white">
                  Book a Call
                </Link>
              </nav>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
