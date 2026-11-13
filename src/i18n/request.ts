import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Giao diện thuần Việt Nam 100%
  const locale = 'vi';
  return {
    locale,
    messages: (await import('../../messages/vi.json')).default,
  };
});
