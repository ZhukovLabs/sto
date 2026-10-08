import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/shared/api/AppProviders';

export const metadata: Metadata = {
  title: 'ПроМакс — панель управления',
  description: 'Административная панель СТО «ПроМакс»',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="scroll-slim">
      <body className="bg-bg font-sans text-content antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
