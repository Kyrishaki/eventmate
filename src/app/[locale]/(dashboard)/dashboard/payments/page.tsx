'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';

export default function PaymentsRedirectPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/dashboard/orders?tab=payments');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-[#737373]">
      Đang chuyển hướng sang trang Đơn hàng &amp; Thanh toán...
    </div>
  );
}
