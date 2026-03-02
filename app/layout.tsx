import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Team 4 Schedule Dashboard',
  description: 'Regional Store Manager Work Schedule Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-[#F8F9FA] text-[#1A1A1A]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
