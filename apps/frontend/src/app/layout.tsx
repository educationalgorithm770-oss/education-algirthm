import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import FloatingAIChatbot from '@/components/ui/FloatingAIChatbot';
import LandingWebinarPopup from '@/components/ui/LandingWebinarPopup';
import MobileAppBridge from '@/components/mobile/MobileAppBridge';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Education Algorithm — Enterprise EdTech & Engineering Accelerator',
  description: 'Master Java Full Stack, System Design, Data Science, and GenAI Agentic Systems with interactive code practice, live mentorship, and real-world capstone projects.',
  icons: {
    icon: [
      { url: '/favicon.svg?v=5', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=5', sizes: 'any' },
      { url: '/icon-192.png?v=5', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=5', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=5',
  },
  manifest: '/manifest.json?v=5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg?v=5" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=5" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=5" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=5" />
        <link rel="manifest" href="/manifest.json?v=5" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600 selection:text-white text-base`}>
        <MobileAppBridge />
        {children}
        <MobileBottomNav />
        <FloatingAIChatbot />
        <LandingWebinarPopup />
      </body>
    </html>
  );
}
