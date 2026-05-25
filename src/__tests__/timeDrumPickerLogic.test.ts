import {
  buildHourItems,
  buildMinuteItems,
  buildPeriodItems,
  buildSecondItems,
  clampHour12,
  clampHour24,
  clampMinute,
  clampSecond,
  clampTimeValue,
  from12Hour,
  hourIndex,
  minuteIndex,
  normalizeInterval,
  periodIndex,
  snapToInterval,
  to12Hour,
} from '../timeDrumPickerLogic';

describe('timeDrumPickerLogic', () => {
  describe('normalizeInterval', () => {
    it('returns 1 when interval is undefined', () => {
      expect(normalizeInterval(undefined)).toBe(1);
    });

    it('accepts every supported interval', () => {
      for (const value of [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30]) {
        expect(normalizeInterval(value)).toBe(value);
      }
    });

    it('falls back to 1 for unsupported intervals', () => {
      expect(normalizeInterval(7)).toBe(1);
      expect(normalizeInterval(0)).toBe(1);
      expect(normalizeInterval(45)).toBe(1);
    });

    it('rounds before validating', () => {
      expect(normalizeInterval(4.4)).toBe(4);
    });
  });

  describe('clampHour24', () => {
    it('clamps below range to 0', () => {
      expect(clampHour24(-3)).toBe(0);
    });
    it('clamps above range to 23', () => {
      expect(clampHour24(99)).toBe(23);
    });
    it('rounds floats', () => {
      expect(clampHour24(5.6)).toBe(6);
    });
    it('returns 0 for non-finite input', () => {
      expect(clampHour24(NaN)).toBe(0);
      expect(clampHour24(Infinity)).toBe(0);
    });
  });

  describe('clampHour12', () => {
    it('clamps to [1, 12]', () => {
      expect(clampHour12(0)).toBe(1);
      expect(clampHour12(13)).toBe(12);
      expect(clampHour12(7)).toBe(7);
    });
    it('returns 12 for non-finite input', () => {
      expect(clampHour12(NaN)).toBe(12);
    });
  });

  describe('clampMinute / clampSecond', () => {
    it('clamps to [0, 59]', () => {
      expect(clampMinute(-1)).toBe(0);
      expect(clampMinute(60)).toBe(59);
      expect(clampSecond(120)).toBe(59);
    });
  });

  describe('snapToInterval', () => {
    it('returns the value when interval is 1', () => {
      expect(snapToInterval(37, 1)).toBe(37);
    });
    it('snaps to the nearest multiple', () => {
      expect(snapToInterval(7, 15)).toBe(0);
      expect(snapToInterval(8, 15)).toBe(15);
      expect(snapToInterval(53, 15)).toBe(45);
    });
    it('never exceeds the largest valid multiple within 0..59', () => {
      expect(snapToInterval(58, 15)).toBe(45);
      expect(snapToInterval(59, 30)).toBe(30);
      expect(snapToInterval(58, 20)).toBe(40);
    });
  });

  describe('to12Hour / from12Hour', () => {
    it('round-trips through every 24h hour', () => {
      for (let hour = 0; hour < 24; hour++) {
        const { hour12, period } = to12Hour(hour);
        expect(from12Hour(hour12, period)).toBe(hour);
      }
    });
    it('treats midnight as 12 AM', () => {
      expect(to12Hour(0)).toEqual({ hour12: 12, period: 'AM' });
      expect(from12Hour(12, 'AM')).toBe(0);
    });
    it('treats noon as 12 PM', () => {
      expect(to12Hour(12)).toEqual({ hour12: 12, period: 'PM' });
      expect(from12Hour(12, 'PM')).toBe(12);
    });
    it('handles 1 PM', () => {
      expect(to12Hour(13)).toEqual({ hour12: 1, period: 'PM' });
      expect(from12Hour(1, 'PM')).toBe(13);
    });
  });

  describe('clampTimeValue', () => {
    it('snaps minutes to the supplied interval', () => {
      expect(clampTimeValue({ hour: 9, minute: 53 }, 15)).toEqual({
        hour: 9,
        minute: 45,
        second: 0,
      });
    });
    it('falls back to "now" when fields are missing', () => {
      const before = new Date();
      const v = clampTimeValue(undefined);
      const after = new Date();
      expect(v.hour).toBeGreaterThanOrEqual(0);
      expect(v.hour).toBeLessThanOrEqual(23);
      // sanity check against the test clock
      expect(v.hour).toBeGreaterThanOrEqual(
        Math.min(before.getHours(), after.getHours())
      );
    });
    it('clamps out-of-range hours and minutes', () => {
      expect(clampTimeValue({ hour: 99, minute: -3, second: 120 })).toEqual({
        hour: 23,
        minute: 0,
        second: 59,
      });
    });
  });

  describe('builders', () => {
    it('builds 24 hour items in 24h mode', () => {
      const items = buildHourItems('24', true);
      expect(items).toHaveLength(24);
      expect(items[0]).toBe('00');
      expect(items[23]).toBe('23');
    });
    it('builds 12 hour items in 12h mode starting at 1', () => {
      const items = buildHourItems('12', false);
      expect(items).toHaveLength(12);
      expect(items[0]).toBe('1');
      expect(items[11]).toBe('12');
    });
    it('honors padWithZero=false', () => {
      const items = buildHourItems('24', false);
      expect(items[5]).toBe('5');
    });
    it('builds minute items with interval', () => {
      const items = buildMinuteItems(15, true);
      expect(items).toEqual(['00', '15', '30', '45']);
    });
    it('builds second items with interval', () => {
      expect(buildSecondItems(30, true)).toEqual(['00', '30']);
    });
    it('builds period items', () => {
      expect(buildPeriodItems('AM', 'PM')).toEqual(['AM', 'PM']);
      expect(buildPeriodItems('上午', '下午')).toEqual(['上午', '下午']);
    });
  });

  describe('index helpers', () => {
    it('maps 24h hour to its own index', () => {
      expect(hourIndex(7, '24')).toBe(7);
    });
    it('maps 24h hour to 12h index', () => {
      expect(hourIndex(0, '12')).toBe(11); // 12 AM → index 11
      expect(hourIndex(13, '12')).toBe(0); // 1 PM → index 0
    });
    it('maps minute to interval index', () => {
      expect(minuteIndex(45, 15)).toBe(3);
      expect(minuteIndex(7, 15)).toBe(0);
    });
    it('maps period index for AM and PM', () => {
      expect(periodIndex(2)).toBe(0);
      expect(periodIndex(14)).toBe(1);
    });
  });
});
