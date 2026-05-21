import {
  clampDateDrumPickerValue,
  getDaysInMonth,
  normalizeYearRange,
} from '../dateDrumPickerLogic';

describe('dateDrumPickerLogic', () => {
  it('normalizes inverted year range', () => {
    expect(normalizeYearRange(2035, 2020)).toEqual({
      minYear: 2020,
      maxYear: 2035,
    });
  });

  it('returns days in month for leap year February', () => {
    expect(getDaysInMonth(2, 2024)).toBe(29);
  });

  it('clamps day when month has fewer days', () => {
    const value = clampDateDrumPickerValue(
      { day: 31, month: 4, year: 2024 },
      2020,
      2030
    );
    expect(value.day).toBe(30);
  });
});
