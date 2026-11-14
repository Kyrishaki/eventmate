'use client';

import * as React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface VietnamDateTimeFieldProps {
  id: string;
  label: string;
  value: string;
  minDate?: string;
  required?: boolean;
  onChange: (value: string) => void;
}

function parseVietnamDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${yearText}-${monthText}-${dayText}`;
}

function formatVietnamDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : '';
}

export function VietnamDateTimeField({ id, label, value, minDate, required, onChange }: VietnamDateTimeFieldProps) {
  const [dateText, setDateText] = React.useState(() => formatVietnamDate(value));
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const selectedDate = value.slice(0, 10);
  const selectedMonth = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [visibleMonth, setVisibleMonth] = React.useState(() => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const timeValue = value.slice(11, 16);

  React.useEffect(() => {
    const nextText = formatVietnamDate(value);
    setDateText(nextText);
    const parsed = parseVietnamDate(nextText);
    dateInputRef.current?.setCustomValidity(nextText && !parsed ? 'Ngày không hợp lệ. Hãy nhập theo định dạng DD/MM/YYYY.' : '');
  }, [value]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1
  );

  function commitDate(text: string) {
    const date = parseVietnamDate(text);
    if (!date || !timeValue) return;
    onChange(`${date}T${timeValue}`);
  }

  function setDate(date: string) {
    const nextText = formatVietnamDate(date);
    setDateText(nextText);
    if (timeValue) onChange(`${date}T${timeValue}`);
    setCalendarOpen(false);
  }

  const validDate = parseVietnamDate(dateText);
  const minDateText = minDate ? formatVietnamDate(minDate) : undefined;

  return (
    <section className="relative space-y-1.5">
      <label htmlFor={`${id}-date`} className="text-sm font-medium text-foreground">{label}</label>
      <section className="flex gap-2">
        <section className="relative min-w-0 flex-1">
          <Input
            ref={dateInputRef}
            id={`${id}-date`}
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            autoComplete="off"
            required={required}
            value={dateText}
            pattern="\\d{2}/\\d{2}/\\d{4}"
            title="Nhập ngày theo định dạng DD/MM/YYYY"
            aria-label={`${label}, ngày tháng năm`}
            onChange={(event) => {
              const next = event.target.value;
              setDateText(next);
              const parsed = parseVietnamDate(next);
              event.target.setCustomValidity(next && !parsed ? 'Ngày không hợp lệ. Hãy nhập theo định dạng DD/MM/YYYY.' : '');
              if (parsed && timeValue) onChange(`${parsed}T${timeValue}`);
            }}
            onBlur={() => {
              if (validDate && timeValue) onChange(`${validDate}T${timeValue}`);
            }}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-primary"
            aria-label={`Chọn ngày cho ${label}`}
            aria-expanded={calendarOpen}
            onClick={() => setCalendarOpen((open) => !open)}
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </section>
        <Input
          id={`${id}-time`}
          type="time"
          className="w-32 shrink-0"
          required={required}
          value={timeValue}
          aria-label={`${label}, giờ Việt Nam`}
          onChange={(event) => {
            const nextTime = event.target.value;
            if (validDate && nextTime) onChange(`${validDate}T${nextTime}`);
          }}
        />
      </section>
      <p className="text-[11px] text-muted-foreground">Ngày/tháng/năm · Giờ Việt Nam (UTC+7){minDateText ? ` · Từ ${minDateText}` : ''}</p>
      {calendarOpen && (
        <section className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-surface p-3 shadow-lg" role="dialog" aria-label={`Chọn ngày ${label}`}>
          <header className="mb-2 flex items-center justify-between">
            <button type="button" className="rounded-md p-1 hover:bg-muted" aria-label="Tháng trước" onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <strong className="text-sm">{new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(visibleMonth)}</strong>
            <button type="button" className="rounded-md p-1 hover:bg-muted" aria-label="Tháng sau" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </header>
          <section className="grid grid-cols-7 gap-1 text-center text-xs">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <span key={day} className="py-1 text-muted-foreground">{day}</span>)}
            {calendarCells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} />;
              const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const disabled = Boolean(minDate && date < minDate);
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  aria-pressed={date === selectedDate}
                  className={`rounded-md py-1.5 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-35 ${date === selectedDate ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => setDate(date)}
                >{day}</button>
              );
            })}
          </section>
        </section>
      )}
    </section>
  );
}
