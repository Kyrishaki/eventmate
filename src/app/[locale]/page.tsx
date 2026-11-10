import { redirect } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RootPage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: '/dashboard', locale: (locale as 'vi' | 'en') || 'vi' });
}
