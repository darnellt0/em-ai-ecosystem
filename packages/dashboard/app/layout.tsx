import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Elevated Movements • EM AI Agents',
  description: 'Run EM AI agents from a Goblin.tools inspired gallery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#03040a] text-white antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1f3c40_0%,#03040a_55%)]">
          <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
