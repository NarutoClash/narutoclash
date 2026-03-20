'use client';

import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseClientProvider } from '@/supabase';
import { useSetupPushNotifications } from '@/hooks/use-notifications';

// Componente separado para usar o hook (layout precisa ser client component)
function AppProviders({ children }: { children: React.ReactNode }) {
  useSetupPushNotifications(); // inicializa notificações push no Android
  return <>{children}</>;
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SupabaseClientProvider>
          <AppProviders>
            {children}
            <Toaster />
          </AppProviders>
        </SupabaseClientProvider>

        {/* SDK do Mercado Pago - Device ID Anti-Fraude */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
