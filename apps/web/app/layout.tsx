import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/shared/api/AppProviders';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { MobileActionBar } from '@/widgets/mobile-action-bar';

export const metadata: Metadata = {
  title: 'СТО «ПроМакс» — автосервис в Гомеле',
  description:
    'Честный автосервис в Гомеле: смета до ремонта, договор и гарантия 6 месяцев. Диагностика подвески первым 20 клиентам — бесплатно.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="scroll-slim">
      <body className="bg-bg font-sans text-content antialiased">
        <AppProviders>
          <Header />
          {children}
          <Footer />
          <MobileActionBar />
        </AppProviders>
      </body>
    </html>
  );
}
