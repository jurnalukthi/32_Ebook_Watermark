import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ebook Watermark',
  description: 'Webhook Lynk test endpoint',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
