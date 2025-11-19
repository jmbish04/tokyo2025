import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tokyo 2025 Travel Companion',
  description: 'AI-powered travel assistant for exploring Tokyo in 2025',
};

export const runtime = 'edge';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
