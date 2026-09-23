// web/dateInput.ts
//
// Conversions between `Date` and the value strings of the browser's date and
// time inputs, in local time.
import type { DatePickerMode } from '../DatePickerNativeComponent';

/** The `<input type>` for a picker mode. */
export function inputTypeForMode(
  mode: DatePickerMode | undefined
): 'date' | 'time' | 'datetime-local' {
  switch (mode) {
    case 'time':
    case 'countDownTimer':
      return 'time';
    case 'dateAndTime':
      return 'datetime-local';
    default:
      return 'date';
  }
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** Formats `date` as the value of an input of `type`; `''` for no date. */
export function formatInputValue(
  date: Date | null | undefined,
  type: 'date' | 'time' | 'datetime-local'
): string {
  if (!date || !Number.isFinite(date.getTime())) return '';
  const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (type === 'date') return day;
  if (type === 'time') return time;
  return `${day}T${time}`;
}

/**
 * Parses an input value back into a `Date`. Parts the input doesn't show are
 * kept from `base` (the time of day for a date input, the day for a time
 * input). Returns `null` for an empty or invalid value.
 */
export function parseInputValue(
  value: string,
  type: 'date' | 'time' | 'datetime-local',
  base: Date | null | undefined
): Date | null {
  const result = base ? new Date(base.getTime()) : new Date();
  if (!base) result.setHours(0, 0, 0, 0);

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
