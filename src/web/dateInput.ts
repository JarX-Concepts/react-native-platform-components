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
  const result = base ? new Date(base.getTime()) : new Date();
  if (!base) result.setHours(0, 0, 0, 0);

  if (type === 'month') {
    const monthMatch = /^(\d{4,})-(\d{2})$/.exec(value);
    if (!monthMatch) return null;
    result.setFullYear(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1);
    return Number.isFinite(result.getTime()) ? result : null;
  }

  const dayMatch = /^(\d{4,})-(\d{2})-(\d{2})/.exec(value);
  const timeMatch = /(?:^|T)(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (type !== 'time') {
    if (!dayMatch) return null;
    result.setFullYear(
      Number(dayMatch[1]),
      Number(dayMatch[2]) - 1,
      Number(dayMatch[3])
    );
  }
  if (type !== 'date') {
    if (!timeMatch) return null;
    result.setHours(
      Number(timeMatch[1]),
      Number(timeMatch[2]),
      Number(timeMatch[3] ?? 0),
      0
    );
  }
  return Number.isFinite(result.getTime()) ? result : null;
}
