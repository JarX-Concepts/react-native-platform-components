// web/dateInput.ts
//
// Conversions between `Date` and the value strings of the browser's date and
// time inputs, in local time.
import type { DatePickerMode } from '../DatePickerNativeComponent';

/** The `<input type>`s the pickers use. */
export type DateInputType = 'date' | 'time' | 'datetime-local' | 'month';

/** The `<input type>` for a picker mode. */
export function inputTypeForMode(
  mode: DatePickerMode | undefined
): DateInputType {
  switch (mode) {
    case 'time':
    case 'countDownTimer':
      return 'time';
    case 'dateAndTime':
      return 'datetime-local';
    case 'yearAndMonth':
      return 'month';
    default:
      return 'date';
  }
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** Formats `date` as the value of an input of `type`; `''` for no date. */
export function formatInputValue(
  date: Date | null | undefined,
  type: DateInputType
): string {
  if (!date || !Number.isFinite(date.getTime())) return '';
  const month = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}`;
  const day = `${month}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (type === 'month') return month;
  if (type === 'date') return day;
  if (type === 'time') return time;
  return `${day}T${time}`;
}

/**
 * Parses an input value back into a `Date`. Parts the input doesn't show are
 * kept from `base` (the time of day for a date input, the day for a time
 * input); a month input gives the first of the month. Returns `null` for an
 * empty or invalid value.
 */
export function parseInputValue(
  value: string,
  type: DateInputType,
  base: Date | null | undefined
): Date | null {
  const hasBase = base && Number.isFinite(base.getTime());
  const result = hasBase ? new Date(base.getTime()) : new Date();
  if (!hasBase) result.setHours(0, 0, 0, 0);

  if (type === 'month') {
    const monthMatch = /^(\d{4,})-(\d{2})$/.exec(value);
    if (!monthMatch) return null;
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    if (year < 1 || month < 1 || month > 12) return null;
    result.setFullYear(year, month - 1, 1);
    return Number.isFinite(result.getTime()) ? result : null;
  }

  const dayMatch =
    type === 'date'
      ? /^(\d{4,})-(\d{2})-(\d{2})$/.exec(value)
      : /^(\d{4,})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2})?$/.exec(value);
  const timeMatch = /(?:^|T)(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (type !== 'time') {
    if (!dayMatch) return null;
    const year = Number(dayMatch[1]);
    const month = Number(dayMatch[2]);
    const day = Number(dayMatch[3]);
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    result.setFullYear(year, month - 1, day);
    // Date setters normalize impossible dates (February 30 becomes March 2).
    if (
      result.getFullYear() !== year ||
      result.getMonth() !== month - 1 ||
      result.getDate() !== day
    ) {
      return null;
    }
  }
  if (type !== 'date') {
    if (!timeMatch) return null;
    if (type === 'time' && !/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
      return null;
    }
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] ?? 0);
    if (hours > 23 || minutes > 59 || seconds > 59) return null;
    result.setHours(hours, minutes, seconds, 0);
  }
  return Number.isFinite(result.getTime()) ? result : null;
}

/** Compare only the date/time fields the input displays, like its min/max. */
function inputValueNumber(date: Date, type: DateInputType): number {
  if (type === 'month') return date.getFullYear() * 12 + date.getMonth();
  if (type === 'time') return date.getHours() * 60 + date.getMinutes();
  const result = new Date(date.getTime());
  if (type === 'date') result.setHours(0, 0, 0, 0);
  else result.setSeconds(0, 0);
  return result.getTime();
}

/**
 * Bounds also apply to typed values and the modal's initial selection. HTML
 * inputs report constraint violations but don't prevent a button callback.
 */
export function isWithinInputBounds(
  date: Date | null | undefined,
  type: DateInputType,
  minDate?: Date | null,
  maxDate?: Date | null
): date is Date {
  if (!date || !Number.isFinite(date.getTime())) return false;
  const value = inputValueNumber(date, type);
  const min = minDate ? inputValueNumber(minDate, type) : NaN;
  const max = maxDate ? inputValueNumber(maxDate, type) : NaN;
  // Time inputs have a periodic domain: 23:00–01:00 spans midnight.
  if (type === 'time' && min > max) return value >= min || value <= max;
  return (
    (!Number.isFinite(min) || value >= min) &&
    (!Number.isFinite(max) || value <= max)
  );
}
