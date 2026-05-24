import { render } from '@testing-library/react-native';
import React from 'react';
import {
  fireNativeDrumPickerChange,
  getLatestNativeDrumPickerProps,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';
import { DateDrumPicker } from '../DateDrumPicker';
import { buildMonthItems } from '../dateDrumPickerLogic';

const MODES = [
  'day',
  'month',
  'year',
  'day-month',
  'month-year',
  'day-month-year',
  'month-day-year',
  'year-month-day',
] as const;

describe('DateDrumPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it.each(MODES)('renders mode %s', (mode) => {
    const { toJSON } = render(
      <DateDrumPicker mode={mode} value={{ day: 15, month: 6, year: 2024 }} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('returns day shape from onChange in day mode', () => {
    const onChange = jest.fn();
    render(
      <DateDrumPicker
        mode="day"
        value={{ day: 1, month: 1, year: 2024 }}
        onChange={onChange}
      />
    );
    fireNativeDrumPickerChange(14, '15');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ day: 15, month: 1, year: 2024 })
    );
  });

  it('clamps day for February in non-leap year when controlled', () => {
    const onChange = jest.fn();
    render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 31, month: 2, year: 2023 }}
        onChange={onChange}
      />
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ day: 28, month: 2, year: 2023 })
    );
  });

  it('allows 29 days in February for leap year', () => {
    const onChange = jest.fn();
    render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 29, month: 2, year: 2024 }}
        onChange={onChange}
      />
    );
    expect(getLatestNativeDrumPickerProps()).toBeDefined();
  });

  it('renders short, long, and number month formats', () => {
    const short = buildMonthItems('short', 'en');
    const long = buildMonthItems('long', 'en');
    const number = buildMonthItems('number', 'en');
    expect(short[0]).toBe('Jan');
    expect(long[0]).toBe('January');
    expect(number[0]).toBe('01');
  });

  it('uses locale for month names', () => {
    const ru = buildMonthItems('short', 'ru');
    expect(ru[0]).not.toBe('Jan');
  });

  it('updates internal state in uncontrolled mode', () => {
    const onChange = jest.fn();
    render(
      <DateDrumPicker
        mode="year"
        minYear={2020}
        maxYear={2022}
        onChange={onChange}
      />
    );
    fireNativeDrumPickerChange(0, '2020');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2020 })
    );
  });

  it('respects minYear and maxYear boundaries', () => {
    const years = Array.from({ length: 3 }, (_, i) => String(2020 + i));
    render(<DateDrumPicker mode="year" minYear={2020} maxYear={2022} />);
    const props = getLatestNativeDrumPickerProps();
    expect(props?.items).toEqual(years);
  });

  it('passes hapticFeedback to column pickers', () => {
    render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 1, month: 1, year: 2024 }}
        hapticFeedback
      />
    );
    expect(getLatestNativeDrumPickerProps()?.hapticFeedback).toBe(true);
  });
});
