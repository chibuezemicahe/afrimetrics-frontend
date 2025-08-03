'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

type PageParams = {
  params: Promise<{
    symbol: string
  }>
}

export default function LegacyStockPage({ params }: PageParams) {
  const router = useRouter();
  const symbol = use(params).symbol;
  
  useEffect(() => {
    // Redirect to the new URL structure
    router.replace(`/markets/NGX/${symbol}`);
  }, [router, symbol]);

  // Return a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--text-muted)]">Redirecting...</p>
    </div>
  );
}