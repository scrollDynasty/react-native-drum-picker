export type DateDrumPickerValue = {
  day?: number;
  month?: number;
  year?: number;
};

export type DateDrumPickerMonthFormat = 'short' | 'long' | 'number';

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, clampMonth(month), 0).getDate();
}

export function normalizeYearRange(
  minYear: number,
  maxYear: number
): { minYear: number; maxYear: number } {
  if (minYear <= maxYear) {
    return { minYear, maxYear };
  }
  return { minYear: maxYear, maxYear: minYear };
}

export function clampMonth(month: number): number {
  return Math.min(12, Math.max(1, Math.round(month)));
}

export function clampYear(
  year: number,
  minYear: number,
  maxYear: number
): number {
  return Math.min(maxYear, Math.max(minYear, Math.round(year)));
}

export function clampDayForMonth(
  day: number,
  month: number,
  year: number
): number {
  const maxDay = getDaysInMonth(month, year);
  return Math.min(maxDay, Math.max(1, Math.round(day)));
}

export function clampDateDrumPickerValue(
  value: DateDrumPickerValue,
  minYear: number,
  maxYear: number
): Required<DateDrumPickerValue> {
  const { minYear: min, maxYear: max } = normalizeYearRange(minYear, maxYear);
  const now = new Date();
  const month = clampMonth(value.month ?? now.getMonth() + 1);
  const year = clampYear(value.year ?? now.getFullYear(), min, max);
  const day = clampDayForMonth(value.day ?? now.getDate(), month, year);
  return { day, month, year };
}

export function buildDayItems(month: number, year: number): string[] {
  const count = getDaysInMonth(month, year);
  return Array.from({ length: count }, (_, index) => String(index + 1));
}

export function buildDayItemsInRange(minDay: number, maxDay: number): string[] {
  return Array.from({ length: maxDay - minDay + 1 }, (_, index) =>
    String(minDay + index)
  );
}

export function buildMonthItemsInRange(
  minMonth: number,
  maxMonth: number,
  monthFormat: DateDrumPickerMonthFormat,
  locale: string
): string[] {
  const all = buildMonthItems(monthFormat, locale);
  return all.slice(minMonth - 1, maxMonth);
}

export function buildMonthItems(
  monthFormat: DateDrumPickerMonthFormat,
  locale: string
): string[] {
  if (monthFormat === 'number') {
    return Array.from({ length: 12 }, (_, index) =>
      String(index + 1).padStart(2, '0')
    );
  }

  const monthStyle = monthFormat === 'long' ? 'long' : 'short';
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2020, index, 1);
    return new Intl.DateTimeFormat(locale, { month: monthStyle }).format(date);
  });
}

export function buildYearItems(minYear: number, maxYear: number): string[] {
  const { minYear: min, maxYear: max } = normalizeYearRange(minYear, maxYear);
  const length = max - min + 1;
  return Array.from({ length }, (_, index) => String(min + index));
}

export function parseMonthFromLabel(
  label: string,
  monthFormat: DateDrumPickerMonthFormat,
  monthItems: string[]
): number {
  if (monthFormat === 'number') {
    return clampMonth(Number.parseInt(label, 10));
  }
  const index = monthItems.indexOf(label);
  return index >= 0 ? index + 1 : 1;
}
