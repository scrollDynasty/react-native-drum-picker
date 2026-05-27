import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import {
  fireNativeDrumPickerChange,
  getLatestNativeDrumPickerProps,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';
import { DateDrumPicker } from '../DateDrumPicker';
import { DrumPicker } from '../DrumPicker.native';
import { buildMonthItems, getDaysInMonth } from '../dateDrumPickerLogic';

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

function getNativePickers() {
  return screen.getAllByTestId('drum-picker-native');
}

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

  it('renders 28 days for February in non-leap year', () => {
    render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 1, month: 2, year: 2023 }}
        onChange={() => {}}
      />
    );
    const dayPicker = getNativePickers()[0];
    expect(dayPicker.props.items).toHaveLength(28);
  });

  it('renders 29 days for February in leap year', () => {
    render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 1, month: 2, year: 2024 }}
        onChange={() => {}}
      />
    );
    const dayPicker = getNativePickers()[0];
    expect(dayPicker.props.items).toHaveLength(29);
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

  it('passes ru locale to month column in rendered DateDrumPicker', () => {
    render(
      <DateDrumPicker
        mode="month-year"
        value={{ month: 1, year: 2024 }}
        locale="ru"
        onChange={() => {}}
      />
    );
    const monthPicker = getNativePickers()[0];
    const items = monthPicker.props.items as string[];
    expect(items[0]).not.toBe('Jan');
  });

  it('forwards onValueChanging with column key', () => {
    const onValueChanging = jest.fn();
    render(
      <DateDrumPicker
        mode="month-year"
        value={{ month: 1, year: 2024 }}
        onValueChanging={onValueChanging}
        onChange={() => {}}
      />
    );
    const monthPicker = getNativePickers()[0];
    act(() => {
      monthPicker.props.onValueChanging?.({
        nativeEvent: { index: 2, value: 'Mar' },
      });
    });
    expect(onValueChanging).toHaveBeenCalledWith(
      'month',
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ index: 2, value: 'Mar' }),
      })
    );
  });

  it('month-year mode onChange updates month from month column', () => {
    const onChange = jest.fn();
    render(
      <DateDrumPicker
        mode="month-year"
        value={{ month: 1, year: 2024 }}
        onChange={onChange}
      />
    );
    const monthPicker = getNativePickers()[0];
    act(() => {
      monthPicker.props.onValueChange?.({
        nativeEvent: { index: 2, value: 'Mar' },
      });
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ month: 3, year: 2024 })
    );
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
    act(() => {
      fireNativeDrumPickerChange(0, '2020');
    });
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

  it('passes enableScrollByTapOnItem to column pickers', () => {
    render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 15, month: 6, year: 2024 }}
        enableScrollByTapOnItem
      />
    );
    expect(getLatestNativeDrumPickerProps()?.enableScrollByTapOnItem).toBe(
      true
    );
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

describe('minDate / maxDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it('year column respects minYear from minDate', () => {
    const { UNSAFE_getAllByType } = render(
      <DateDrumPicker
        mode="day-month-year"
        minDate={{ year: 2022 }}
        maxDate={{ year: 2026 }}
        onChange={() => {}}
      />
    );
    const pickers = UNSAFE_getAllByType(DrumPicker);
    const yearPicker = pickers[2];
    const firstYear = Number.parseInt(yearPicker.props.items[0] as string, 10);
    expect(firstYear).toBe(2022);
    expect(yearPicker.props.items).toHaveLength(5);
  });

  it('month column starts at minDate.month in boundary year', () => {
    const { UNSAFE_getAllByType } = render(
      <DateDrumPicker
        mode="day-month-year"
        minDate={{ year: 2024, month: 6 }}
        maxDate={{ year: 2026 }}
        value={{ day: 1, month: 6, year: 2024 }}
        onChange={() => {}}
      />
    );
    const pickers = UNSAFE_getAllByType(DrumPicker);
    const monthPicker = pickers[1];
    expect(monthPicker.props.items).toHaveLength(7);
  });

  it('clamps value when outside minDate', () => {
    const onChange = jest.fn();
    render(
      <DateDrumPicker
        mode="day-month-year"
        minDate={{ year: 2024, month: 6, day: 15 }}
        value={{ day: 1, month: 1, year: 2023 }}
        onChange={onChange}
      />
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ day: 15, month: 6, year: 2024 })
    );
  });

  it('backward compat: minYear/maxYear still works', () => {
    const { UNSAFE_getAllByType } = render(
      <DateDrumPicker
        mode="day-month-year"
        minYear={2020}
        maxYear={2025}
        onChange={() => {}}
      />
    );
    const pickers = UNSAFE_getAllByType(DrumPicker);
    const yearPicker = pickers[2];
    expect(yearPicker.props.items).toHaveLength(6);
  });

  it('day column respects minDate.day', () => {
    const { UNSAFE_getAllByType } = render(
      <DateDrumPicker
        mode="day-month-year"
        minDate={{ year: 2024, month: 6, day: 15 }}
        maxDate={{ year: 2026 }}
        value={{ day: 20, month: 6, year: 2024 }}
        onChange={() => {}}
      />
    );
    const dayPicker = UNSAFE_getAllByType(DrumPicker)[0];
    expect(dayPicker.props.items).toHaveLength(
      getDaysInMonth(6, 2024) - 15 + 1
    );
    expect(dayPicker.props.items[0]).toBe('15');
  });

  it('getCurrentDate uses constrained day offset', () => {
    const ref = React.createRef<import('../types').DateDrumPickerRef>();
    render(
      <DateDrumPicker
        ref={ref}
        mode="day-month-year"
        minDate={{ year: 2024, month: 6, day: 15 }}
        value={{ day: 20, month: 6, year: 2024 }}
        onChange={() => {}}
      />
    );
    expect(ref.current?.getCurrentDate().day).toBe(20);
  });

  it('onValueChanging reports calendar month index', () => {
    const onValueChanging = jest.fn();
    render(
      <DateDrumPicker
        mode="month-year"
        minDate={{ year: 2024, month: 6 }}
        value={{ month: 6, year: 2024 }}
        onValueChanging={onValueChanging}
        onChange={() => {}}
      />
    );
    const monthPicker = getNativePickers()[0];
    act(() => {
      monthPicker.props.onValueChanging?.({
        nativeEvent: { index: 2, value: 'Aug' },
      });
    });
    expect(onValueChanging).toHaveBeenCalledWith(
      'month',
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ index: 7, value: 'Aug' }),
      })
    );
  });

  it('notifies onChange when uncontrolled constraints tighten', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <DateDrumPicker
        mode="year"
        minYear={2020}
        maxYear={2025}
        onChange={onChange}
      />
    );
    onChange.mockClear();
    rerender(
      <DateDrumPicker
        mode="year"
        minYear={2022}
        maxYear={2025}
        onChange={onChange}
      />
    );
    expect(onChange).toHaveBeenCalled();
  });
});
