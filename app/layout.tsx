import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ebook Watermark',
  description: 'Private ebook access and watermark delivery system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
