import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseWatch | Market Intelligence & Delta Platform',
  description: 'Smart contextual market watchlist designed for the Groww Engineering Challenge.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}