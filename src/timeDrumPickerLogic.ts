export type TimeDrumPickerValue = {
  hour?: number;
  minute?: number;
  second?: number;
};

export type TimeDrumPickerHourFormat = '12' | '24';

export type TimeDrumPickerPeriod = 'AM' | 'PM';

/**
 * Allowed minute / second intervals. Mirrors the values UIDatePicker supports
 * for its `minuteInterval` property so 60 stays divisible without leftovers.
 */
export type TimeDrumPickerInterval =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 10
  | 12
  | 15
  | 20
  | 30;

const VALID_INTERVALS: ReadonlyArray<TimeDrumPickerInterval> = [
  1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30,
];

export function normalizeInterval(
  interval: number | undefined
): TimeDrumPickerInterval {
  if (interval === undefined) {
    return 1;
  }
  const rounded = Math.round(interval);
  const match = VALID_INTERVALS.find((value) => value === rounded);
  return match ?? 1;
}

export function clampHour24(hour: number): number {
  if (!Number.isFinite(hour)) {
    return 0;
  }
  return Math.min(23, Math.max(0, Math.round(hour)));
}

export function clampHour12(hour: number): number {
  if (!Number.isFinite(hour)) {
    return 12;
  }
  return Math.min(12, Math.max(1, Math.round(hour)));
}

export function clampMinute(minute: number): number {
  if (!Number.isFinite(minute)) {
    return 0;
  }
  return Math.min(59, Math.max(0, Math.round(minute)));
}

export function clampSecond(second: number): number {
  return clampMinute(second);
}

/**
 * Snap a 0..59 value to the nearest multiple of `interval` that is still
 * within range. Exact half-step ties round **down** (deterministic and
 * matches the floor semantics users expect when the picker first lands on a
 * value, e.g. minute 30 with interval 60 stays on the lower mark).
 */
export function snapToInterval(
  value: number,
  interval: TimeDrumPickerInterval
): number {
  const safe = clampMinute(value);
  if (interval === 1) {
    return safe;
  }
  // Round half *down*: Math.round rounds halves up, so subtract 0.5 and
  // take the ceiling. e.g. 3 / 2 -> ceil(1.0) = 1 -> 2 (not 4).
  const steps = Math.ceil(safe / interval - 0.5);
  const snapped = steps * interval;
  const max = Math.floor(59 / interval) * interval;
  return Math.min(max, Math.max(0, snapped));
}

export function to12Hour(hour24: number): {
  hour12: number;
  period: TimeDrumPickerPeriod;
} {
  const safe = clampHour24(hour24);
  const period: TimeDrumPickerPeriod = safe < 12 ? 'AM' : 'PM';
  const remainder = safe % 12;
  const hour12 = remainder === 0 ? 12 : remainder;
  return { hour12, period };
}

export function from12Hour(
  hour12: number,
  period: TimeDrumPickerPeriod
): number {
  const safe = clampHour12(hour12);
  const base = safe === 12 ? 0 : safe;
  return period === 'AM' ? base : base + 12;
}

export function clampTimeValue(
  value: TimeDrumPickerValue | undefined,
  interval: TimeDrumPickerInterval = 1,
  secondInterval: TimeDrumPickerInterval = 1
): Required<TimeDrumPickerValue> {
  const source = value ?? {};
  const now = new Date();
  const hour = clampHour24(source.hour ?? now.getHours());
  const minute = snapToInterval(source.minute ?? now.getMinutes(), interval);
  const second = snapToInterval(source.second ?? 0, secondInterval);
  return { hour, minute, second };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function buildHourItems(
  format: TimeDrumPickerHourFormat,
  padWithZero: boolean
): string[] {
  if (format === '24') {
    return Array.from({ length: 24 }, (_, index) =>
      padWithZero ? pad2(index) : String(index)
    );
  }
  return Array.from({ length: 12 }, (_, index) => {
    const hour12 = index + 1;
    return padWithZero ? pad2(hour12) : String(hour12);
  });
}

export function buildMinuteItems(
  interval: TimeDrumPickerInterval,
  padWithZero: boolean
): string[] {
  const length = Math.floor(60 / interval);
  return Array.from({ length }, (_, index) => {
    const minute = index * interval;
    return padWithZero ? pad2(minute) : String(minute);
  });
}

export function buildSecondItems(
  interval: TimeDrumPickerInterval,
  padWithZero: boolean
): string[] {
  return buildMinuteItems(interval, padWithZero);
}

export function buildPeriodItems(
  amLabel: string,
  pmLabel: string
): [string, string] {
  return [amLabel, pmLabel];
}

export function minuteIndex(
  minute: number,
  interval: TimeDrumPickerInterval
): number {
  const snapped = snapToInterval(minute, interval);
  return Math.floor(snapped / interval);
}

export function hourIndex(
  hour24: number,
  format: TimeDrumPickerHourFormat
): number {
  if (format === '24') {
    return clampHour24(hour24);
  }
  return to12Hour(hour24).hour12 - 1;
}

export function periodIndex(hour24: number): 0 | 1 {
  return to12Hour(hour24).period === 'AM' ? 0 : 1;
}
