'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MobileAppBridge() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAppGateway = async () => {
      let isNative = false;
      try {
        const { Capacitor } = await import('@capacitor/core');
        isNative = Capacitor.isNativePlatform();

        if (isNative) {
          // Configure Status Bar
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#0A0D14' });

          // Hide Splash Screen
          const { SplashScreen } = await import('@capacitor/splash-screen');
          await SplashScreen.hide();

          // Hardware Back Button
          const { App } = await import('@capacitor/app');
          App.addListener('backButton', ({ canGoBack }) => {
            if (pathname === '/dashboard' || pathname === '/login') {
              App.exitApp();
            } else if (canGoBack) {
              window.history.back();
            } else {
              router.push('/dashboard');
            }
          });
        }
      } catch (e) {
        console.warn('[MobileAppBridge] Capacitor init:', e);
      }

      // If running inside Native App, enforce strict Student LMS boundaries (No public marketing pages)
      if (isNative) {
        const publicRoutes = ['/', '/courses', '/about', '/contact', '/privacy', '/terms', '/scholarships', '/webinars'];
        const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

        try {
          const meRes = await fetch('/api/auth/me', { credentials: 'include' });
          const meData = await meRes.json();

          if (!meData.success) {
            // Not logged in -> Immediately show Instagram-style Login screen
            if (!isAuthRoute) {
              router.replace('/login');
            }
          } else {
            // Logged in -> Ensure they stay inside Student LMS (never on public marketing landing)
            if (publicRoutes.includes(pathname || '')) {
              router.replace('/dashboard');
            }
          }
        } catch {
          if (!isAuthRoute) {
            router.replace('/login');
          }
        }
      }
    };

    initAppGateway();
  }, [pathname, router]);

  return null;
}
