import { render, screen } from '@testing-library/react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { resetNativeDrumPickerMocks } from '../__mocks__/DrumPickerViewNativeComponent';
import { DateDrumPicker } from '../DateDrumPicker';
import type { DateDrumPickerRef } from '../types';

/**
 * The acceptance scenario reported from a production integration: an accordion that mounts a
 * controlled `DateDrumPicker` and expects the value alone to position every column, without ref
 * calls, phased ranges or onChange suppression flags on the parent side.
 */

const MIN_DATE = { day: 1, month: 1, year: 1966 };
const MAX_DATE = { day: 31, month: 12, year: 2031 };

type ColumnState = { day: number; month: number; year: number };

function readColumns(): ColumnState {
  const pickers = screen.getAllByTestId('drum-picker-native');
  const [dayPicker, monthPicker, yearPicker] = pickers;
  const label = (node: (typeof pickers)[number], index: number) =>
    node.props.items[index];
  return {
    day: Number(label(dayPicker!, dayPicker!.props.selectedIndex)),
    month: monthPicker!.props.selectedIndex + 1,
    year: Number(label(yearPicker!, yearPicker!.props.selectedIndex)),
  };
}

describe('DateDrumPicker — controlled value positions every column', () => {
  beforeEach(() => {
    resetNativeDrumPickerMocks();
  });

  it('positions all columns from `value` on mount without any ref call', () => {
    const onChange = jest.fn();
    render(
      <DateDrumPicker
        mode="day-month-year"
        locale="ru"
        value={{ day: 26, month: 7, year: 2026 }}
        onChange={onChange}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
        itemHeight={44}
        visibleItemCount={5}
      />
    );

    expect(readColumns()).toEqual({ day: 26, month: 7, year: 2026 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('positions all columns when mounted inside a zero-height container', () => {
    const onChange = jest.fn();
    render(
      <View style={{ height: 0, overflow: 'hidden' }}>
        <DateDrumPicker
          mode="day-month-year"
          locale="ru"
          value={{ day: 26, month: 7, year: 2026 }}
          onChange={onChange}
          minDate={MIN_DATE}
          maxDate={MAX_DATE}
        />
      </View>
    );

    // Layout never happens in the JS test environment, which is exactly the collapsed case: the
    // native view must still be told which index to centre.
    expect(readColumns()).toEqual({ day: 26, month: 7, year: 2026 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('follows an external `value` change without emitting onChange', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 26, month: 7, year: 2026 }}
        onChange={onChange}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
      />
    );
    expect(readColumns()).toEqual({ day: 26, month: 7, year: 2026 });

    rerender(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 3, month: 2, year: 1999 }}
        onChange={onChange}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
      />
    );

    expect(readColumns()).toEqual({ day: 3, month: 2, year: 1999 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the selected date when the range widens, and stays silent', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 26, month: 7, year: 2026 }}
        onChange={onChange}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
      />
    );
    expect(readColumns()).toEqual({ day: 26, month: 7, year: 2026 });

    rerender(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 26, month: 7, year: 2026 }}
        onChange={onChange}
        minDate={{ day: 1, month: 1, year: 1926 }}
        maxDate={{ day: 31, month: 12, year: 2076 }}
      />
    );

    expect(readColumns()).toEqual({ day: 26, month: 7, year: 2026 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the selected date when the range narrows around it, and stays silent', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 26, month: 7, year: 2026 }}
        onChange={onChange}
        minDate={{ day: 1, month: 1, year: 1926 }}
        maxDate={{ day: 31, month: 12, year: 2076 }}
      />
    );

    rerender(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 26, month: 7, year: 2026 }}
        onChange={onChange}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
      />
    );

    expect(readColumns()).toEqual({ day: 26, month: 7, year: 2026 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports the same date through getCurrentDate() as the columns show', () => {
    const ref = React.createRef<DateDrumPickerRef>();
    render(
      <DateDrumPicker
        ref={ref}
        mode="day-month-year"
        value={{ day: 26, month: 7, year: 2026 }}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
      />
    );

    expect(ref.current?.getCurrentDate()).toEqual(readColumns());
  });

  it('survives the open/close cycle of a conditionally rendered section', () => {
    const onChange = jest.fn();

    function Host({ open }: { open: boolean }) {
      const [date] = useState({ day: 26, month: 7, year: 2026 });
      return open ? (
        <DateDrumPicker
          mode="day-month-year"
          locale="ru"
          value={date}
          onChange={onChange}
          minDate={MIN_DATE}
          maxDate={MAX_DATE}
          itemHeight={44}
          visibleItemCount={5}
        />
      ) : null;
    }

    const { rerender } = render(<Host open={false} />);
    expect(screen.queryAllByTestId('drum-picker-native')).toHaveLength(0);

    rerender(<Host open />);
    expect(readColumns()).toEqual({ day: 26, month: 7, year: 2026 });
    expect(onChange).not.toHaveBeenCalled();
  });
});
