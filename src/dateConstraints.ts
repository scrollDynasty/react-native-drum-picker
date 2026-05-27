import { getDaysInMonth } from './dateDrumPickerLogic';
import type { DateConstraint } from './types';

export interface ResolvedConstraint {
  minYear: number;
  maxYear: number;
  minMonth: (year: number) => number;
  maxMonth: (year: number) => number;
  minDay: (year: number, month: number) => number;
  maxDay: (year: number, month: number) => number;
}

export function resolveConstraints(
  minDate?: DateConstraint,
  maxDate?: DateConstraint
): ResolvedConstraint {
  const minY = minDate?.year ?? 1900;
  const maxY = maxDate?.year ?? 2100;
  const minM = minDate?.month ?? 1;
  const maxM = maxDate?.month ?? 12;
  const minD = minDate?.day ?? 1;
  const maxD = maxDate?.day ?? 31;

  return {
    minYear: minY,
    maxYear: maxY,

    minMonth(year: number) {
      if (year === minY) {
        return minM;
      }
      return 1;
    },
    maxMonth(year: number) {
      if (year === maxY) {
        return maxM;
      }
      return 12;
    },

    minDay(year: number, month: number) {
      if (year === minY && month === minM) {
        return minD;
      }
      return 1;
    },
    maxDay(year: number, month: number) {
      if (year === maxY && month === maxM) {
        return maxD;
      }
      return getDaysInMonth(month, year);
    },
  };
}

/**
 * Clamp a date object to the resolved constraint range.
 */
export function clampToConstraints(
  date: { day: number; month: number; year: number },
  c: ResolvedConstraint
): { day: number; month: number; year: number } {
  const year = Math.min(Math.max(date.year, c.minYear), c.maxYear);
  const month = Math.min(
    Math.max(date.month, c.minMonth(year)),
    c.maxMonth(year)
  );
  const day = Math.min(
    Math.max(date.day, c.minDay(year, month)),
    c.maxDay(year, month)
  );
  return { day, month, year };
}
