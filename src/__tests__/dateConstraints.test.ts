import { clampToConstraints, resolveConstraints } from '../dateConstraints';

describe('resolveConstraints', () => {
  it('defaults to full range when no constraints', () => {
    const c = resolveConstraints();
    expect(c.minYear).toBe(1900);
    expect(c.maxYear).toBe(2100);
    expect(c.minMonth(2024)).toBe(1);
    expect(c.maxMonth(2024)).toBe(12);
    expect(c.minDay(2024, 3)).toBe(1);
    expect(c.maxDay(2024, 3)).toBe(31);
  });

  it('restricts months in boundary years', () => {
    const c = resolveConstraints(
      { year: 2020, month: 6 },
      { year: 2025, month: 9 }
    );
    expect(c.minMonth(2020)).toBe(6);
    expect(c.minMonth(2021)).toBe(1);
    expect(c.maxMonth(2025)).toBe(9);
    expect(c.maxMonth(2024)).toBe(12);
  });

  it('restricts days in boundary year+month', () => {
    const c = resolveConstraints(
      { year: 2024, month: 3, day: 15 },
      { year: 2024, month: 3, day: 20 }
    );
    expect(c.minDay(2024, 3)).toBe(15);
    expect(c.maxDay(2024, 3)).toBe(20);
    expect(c.minDay(2024, 4)).toBe(1);
  });

  it('partial minDate — only year given', () => {
    const c = resolveConstraints({ year: 2022 });
    expect(c.minYear).toBe(2022);
    expect(c.minMonth(2022)).toBe(1);
    expect(c.minDay(2022, 1)).toBe(1);
  });

  it('swaps inverted year range', () => {
    const c = resolveConstraints({ year: 2030 }, { year: 2020 });
    expect(c.minYear).toBe(2020);
    expect(c.maxYear).toBe(2030);
  });
});

describe('clampToConstraints', () => {
  it('clamps year below min', () => {
    const c = resolveConstraints({ year: 2020 }, { year: 2030 });
    const result = clampToConstraints({ day: 1, month: 1, year: 2015 }, c);
    expect(result.year).toBe(2020);
  });

  it('clamps year above max', () => {
    const c = resolveConstraints({ year: 2020 }, { year: 2030 });
    const result = clampToConstraints({ day: 1, month: 1, year: 2035 }, c);
    expect(result.year).toBe(2030);
  });

  it('clamps month when year hits min boundary', () => {
    const c = resolveConstraints({ year: 2024, month: 6 }, { year: 2030 });
    const result = clampToConstraints({ day: 1, month: 3, year: 2024 }, c);
    expect(result.month).toBe(6);
  });

  it('clamps day when month hits min boundary', () => {
    const c = resolveConstraints({ year: 2024, month: 6, day: 15 });
    const result = clampToConstraints({ day: 5, month: 6, year: 2024 }, c);
    expect(result.day).toBe(15);
  });

  it('clamps month after year moves to boundary year', () => {
    const c = resolveConstraints({ year: 2024, month: 6, day: 1 });
    const result = clampToConstraints(
      { day: 1, month: 1, year: 2010 },
      c
    );
    expect(result).toEqual({ day: 1, month: 6, year: 2024 });
  });

  it('does not clamp when date is inside range', () => {
    const c = resolveConstraints(
      { year: 2020, month: 1, day: 1 },
      { year: 2030, month: 12, day: 31 }
    );
    const date = { day: 15, month: 6, year: 2025 };
    expect(clampToConstraints(date, c)).toEqual(date);
  });
});
