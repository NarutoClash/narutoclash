import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseClientProvider } from '@/supabase';
import { BattleReportsNotification } from '@/components/battle-reports-notification';

export const metadata: Metadata = {
  title: 'Naruto Clash',
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
          {children}
          <Toaster />
        </SupabaseClientProvider>
      </body>
    </html>
  );
}
