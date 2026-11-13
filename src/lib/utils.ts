import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, _currency: string = 'VND', _locale: string = 'vi-VN') {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

function getVietnameseDateParts(dateInput: string | Date): {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  second: string;
} | null {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || '00';

  const rawHour = pick('hour');
  const hour = rawHour === '24' ? '00' : rawHour;

  return {
    day: pick('day'),
    month: pick('month'),
    year: pick('year'),
    hour,
    minute: pick('minute'),
    second: pick('second'),
  };
}

export function formatDate(dateStr: string | Date, _locale: string = 'vi') {
  const parts = getVietnameseDateParts(dateStr);
  if (!parts) return typeof dateStr === 'string' ? dateStr : '';
  return `${parts.hour}:${parts.minute} - ${parts.day}/${parts.month}/${parts.year}`;
}

export function formatDateOnly(dateStr: string | Date) {
  const parts = getVietnameseDateParts(dateStr);
  if (!parts) return typeof dateStr === 'string' ? dateStr : '';
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function formatTimeOnly(dateStr: string | Date) {
  const parts = getVietnameseDateParts(dateStr);
  if (!parts) return typeof dateStr === 'string' ? dateStr : '';
  return `${parts.hour}:${parts.minute}:${parts.second}`;
}

export function compressImage(file: File, maxDimension = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(result);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

