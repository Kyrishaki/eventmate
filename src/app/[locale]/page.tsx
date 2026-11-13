import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { GuestShowcase } from '@/components/guest/guest-showcase';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RootPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GuestShowcase />;
}
