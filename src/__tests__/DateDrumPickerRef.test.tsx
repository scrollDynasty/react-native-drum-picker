import React, { createRef } from 'react';
import { act, render } from '@testing-library/react-native';
import { DateDrumPicker } from '../DateDrumPicker';
import type { DateDrumPickerRef } from '../types';

describe('DateDrumPickerRef', () => {
  it('ref is not null after render', () => {
    const ref = createRef<DateDrumPickerRef>();
    render(
      <DateDrumPicker ref={ref} mode="day-month-year" onChange={() => {}} />
    );
    expect(ref.current).not.toBeNull();
  });

  it('scrollToDate updates getCurrentDate', () => {
    const ref = createRef<DateDrumPickerRef>();
    render(
      <DateDrumPicker ref={ref} mode="day-month-year" onChange={() => {}} />
    );
    act(() => {
      ref.current?.scrollToDate({ day: 15, month: 6, year: 2025 });
    });
    const date = ref.current?.getCurrentDate();
    expect(date?.day).toBe(15);
    expect(date?.month).toBe(6);
    expect(date?.year).toBe(2025);
  });

  it('scrollToDate with partial fields only updates given columns', () => {
    const ref = createRef<DateDrumPickerRef>();
    render(
      <DateDrumPicker
        ref={ref}
        mode="day-month-year"
        value={{ day: 10, month: 3, year: 2024 }}
        onChange={() => {}}
      />
    );
    act(() => {
      ref.current?.scrollToDate({ month: 12 });
    });
    const date = ref.current?.getCurrentDate();
    expect(date?.month).toBe(12);
    expect(date?.day).toBe(10);
    expect(date?.year).toBe(2024);
  });
});
