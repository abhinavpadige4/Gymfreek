import type { Metadata, Viewport } from 'next';
import { Inter, Russo_One } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { PwaUpdateManager } from '@/components/shared/pwa-update-manager';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Russo_One({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.metadata');

  return {
    title: '100XU',
    description: t('description'),
    applicationName: '100XU',
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: '100XU',
    },
    icons: {
      icon: [
        { url: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/icons/apple-touch-icon.png?v=2',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  // Dark mode by default (locker rooms), togglable via next-themes (/settings page
  // or button in the header).
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <PwaUpdateManager />
            {children}
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
