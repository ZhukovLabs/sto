import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/shared/api/AppProviders';
import { getSiteInfo, SiteInfoProvider } from '@/entities/site';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { MobileActionBar } from '@/widgets/mobile-action-bar';
import { site } from '@/shared/config/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: 'СТО «ПроМакс» — автосервис в Гомеле',
  description:
    'Честный автосервис в Гомеле: смета до начала работ, договор и гарантия 6 месяцев. Замена масла, ремонт двигателя, тормозов и подвески.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const info = await getSiteInfo();

  return (
    <html lang="ru" className="scroll-slim">
      <body className="flex min-h-dvh flex-col bg-bg font-sans text-content antialiased">
        <AppProviders>
          <SiteInfoProvider info={info}>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
            <MobileActionBar />
          </SiteInfoProvider>
        </AppProviders>
      </body>
    </html>
  );
}
