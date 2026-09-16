'use client';

import React from 'react';
import Link from 'next/link';

interface RazorpayCheckoutProps {
  courseId?: number | string;
  courseTitle: string;
  price: number;
  className?: string;
  buttonText?: string;
}

export default function RazorpayCheckout({
  courseId,
  courseTitle,
  price,
  className = '',
  buttonText,
}: RazorpayCheckoutProps) {
  const checkoutUrl = `/checkout?course=${courseId || encodeURIComponent(courseTitle)}`;

  return (
    <div className="w-full">
      <Link
        href={checkoutUrl}
        className={
          className ||
          "w-full px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center text-center cursor-pointer active:scale-98 leading-snug"
        }
      >
        <i className="fa-solid fa-bolt text-amber-300 me-2 text-xs"></i>
        <span>{buttonText || `Enroll Now • ₹${price.toLocaleString()}`}</span>
      </Link>
    </div>
  );
}
