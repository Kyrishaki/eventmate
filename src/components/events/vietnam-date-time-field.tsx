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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  
  const selectedDate = value.slice(0, 10);
  const selectedMonth = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [visibleMonth, setVisibleMonth] = React.useState(() => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
  const timeValue = value.slice(11, 16);

  React.useEffect(() => {
    const nextText = formatVietnamDate(value);
    setDateText(nextText);
    const parsed = parseVietnamDate(nextText);
    dateInputRef.current?.setCustomValidity(nextText && !parsed ? 'Ngày không hợp lệ. Hãy nhập theo định dạng DD/MM/YYYY.' : '');
  }, [value]);

  // Click outside to close calendar
  React.useEffect(() => {
    if (!calendarOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [calendarOpen]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1
  );

  function setDate(date: string) {
    const nextText = formatVietnamDate(date);
    setDateText(nextText);
    if (timeValue) onChange(`${date}T${timeValue}`);
    setCalendarOpen(false);
  }

  const validDate = parseVietnamDate(dateText);
  const minDateText = minDate ? formatVietnamDate(minDate) : undefined;

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={`${id}-date`} className="text-xs font-semibold text-foreground">
          {label} {required && <span className="text-error">*</span>}
        </label>
        <span className="text-[10px] text-muted font-mono">UTC+7</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Date Input with clean spacing and calendar button */}
        <div className="relative flex-1 min-w-0">
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
            className="pr-9 font-medium text-xs sm:text-sm tracking-wide"
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
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-primary transition-colors cursor-pointer"
            aria-label={`Chọn ngày cho ${label}`}
            aria-expanded={calendarOpen}
            onClick={() => {
              if (!calendarOpen && selectedDate) {
                const parts = selectedDate.split('-');
                if (parts.length === 3) {
                  setVisibleMonth(new Date(Number(parts[0]), Number(parts[1]) - 1, 1));
                }
              }
              setCalendarOpen((open) => !open);
            }}
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>

        {/* Time Input constrained inside a fixed-width container */}
        <div className="w-32 sm:w-36 shrink-0">
          <Input
            id={`${id}-time`}
            type="time"
            required={required}
            value={timeValue}
            aria-label={`${label}, giờ Việt Nam`}
            className="text-center font-mono text-xs sm:text-sm px-2 font-medium"
            onChange={(event) => {
              const nextTime = event.target.value;
              if (validDate && nextTime) onChange(`${validDate}T${nextTime}`);
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted">
        <span>Định dạng: Ngày/Tháng/Năm & Giờ</span>
        {minDateText && <span className="text-primary/80">Từ {minDateText}</span>}
      </div>

      {calendarOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-68 max-w-[90vw] rounded-xl border border-border bg-surface p-3.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150"
          role="dialog"
          aria-label={`Chọn ngày ${label}`}
        >
          <header className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-md p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              aria-label="Tháng trước"
              onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <strong className="text-xs sm:text-sm font-semibold capitalize text-foreground">
              {new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(visibleMonth)}
            </strong>
            <button
              type="button"
              className="rounded-md p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              aria-label="Tháng sau"
              onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </header>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-1 font-semibold text-muted">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
              <span key={day} className="py-1">{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarCells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} />;
              const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const disabled = Boolean(minDate && date < minDate);
              const isSelected = date === selectedDate;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`rounded-lg py-1.5 font-medium transition-all text-xs disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'hover:bg-surface-hover text-foreground'
                  }`}
                  onClick={() => setDate(date)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
            <button
              type="button"
              className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
              onClick={() => {
                const now = new Date();
                const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                if (!minDate || todayIso >= minDate) {
                  setDate(todayIso);
                }
              }}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className="text-[11px] text-muted hover:text-foreground cursor-pointer"
              onClick={() => setCalendarOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
