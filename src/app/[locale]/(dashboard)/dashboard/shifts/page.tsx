'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function ShiftsPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/dashboard/orders');
  }, [router]);

  return null;
}
