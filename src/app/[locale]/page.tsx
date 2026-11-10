import { redirect } from '@/i18n/routing';

export default function RootPage() {
  redirect({ href: '/dashboard', locale: 'vi' });
}
