import { getDaysInMonth, normalizeYearRange } from './dateDrumPickerLogic';
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
  let minM = minDate?.month ?? 1;
  let maxM = maxDate?.month ?? 12;
  if (minM > maxM) {
    [minM, maxM] = [maxM, minM];
  }

  let minD = minDate?.day ?? 1;
  let maxD = maxDate?.day ?? 31;
  if (minD > maxD) {
    [minD, maxD] = [maxD, minD];
  }

  const { minYear: minY, maxYear: maxY } = normalizeYearRange(
    minDate?.year ?? 1900,
    maxDate?.year ?? 2100
  );

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
  let year = date.year;
  let month = date.month;
  let day = date.day;

  for (let pass = 0; pass < 4; pass += 1) {
    const nextYear = Math.min(Math.max(year, c.minYear), c.maxYear);
    const nextMonth = Math.min(
      Math.max(month, c.minMonth(nextYear)),
      c.maxMonth(nextYear)
    );
    const nextDay = Math.min(
      Math.max(day, c.minDay(nextYear, nextMonth)),
      c.maxDay(nextYear, nextMonth)
    );
    if (nextYear === year && nextMonth === month && nextDay === day) {
      return { day: nextDay, month: nextMonth, year: nextYear };
    }
    year = nextYear;
    month = nextMonth;
    day = nextDay;
  }

  return { day, month, year };
}
