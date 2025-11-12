'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the payment reference from URL params
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    
    if (reference) {
      // Redirect to the verify page with the reference
      router.replace(`/payments/verify?reference=${reference}`);
    } else {
      // If no reference, redirect to events page
      router.replace('/events');
    }
  }, [router, searchParams]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Redirecting to payment verification...</p>
      </div>
    </div>
  );
}
