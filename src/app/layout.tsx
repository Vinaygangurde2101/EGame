import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KNOWLEDGE EXCHANGE — Turn Your Knowledge Into Capital',
  description: 'Live quiz + stock-market-style virtual capital simulation game.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
