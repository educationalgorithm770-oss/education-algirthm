'use client';

import React, { Suspense } from 'react';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';
import EnrollmentFlow from '@/components/enrollment/EnrollmentFlow';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <HeaderNavbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-600"></i>
              <span className="text-sm font-bold text-slate-500">Loading Admissions Desk...</span>
            </div>
          }
        >
          <EnrollmentFlow />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
