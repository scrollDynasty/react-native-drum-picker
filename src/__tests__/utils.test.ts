import {
  buildDayItems,
  buildMonthItems,
  buildYearItems,
  clampDayForMonth,
  getDaysInMonth,
  parseMonthFromLabel,
} from '../dateDrumPickerLogic';

describe('dateDrumPicker utilities', () => {
  it('builds day items for month length', () => {
    expect(buildDayItems(2, 2023)).toHaveLength(28);
    expect(buildDayItems(2, 2024)).toHaveLength(29);
  });

  it('builds year items within range', () => {
    expect(buildYearItems(2020, 2022)).toEqual(['2020', '2021', '2022']);
  });

  it('parses month label for number format', () => {
    const items = buildMonthItems('number', 'en');
    expect(parseMonthFromLabel('3', 'number', items)).toBe(3);
  });

  it('clamps day for April', () => {
    expect(clampDayForMonth(31, 4, 2024)).toBe(30);
  });

  it('reports days in month', () => {
    expect(getDaysInMonth(2, 2024)).toBe(29);
    expect(getDaysInMonth(2, 2023)).toBe(28);
  });
});
