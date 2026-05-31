import { render, screen } from '@testing-library/react-native';
import React from 'react';
import {
  getLatestNativeDrumPickerProps,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';
import { DrumPicker } from '../DrumPicker.native';
import { DateDrumPicker } from '../DateDrumPicker';
import { TimeDrumPicker } from '../TimeDrumPicker';

function getNativePickers() {
  return screen.getAllByTestId('drum-picker-native');
}

describe('accessibilityLabel forwarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it('forwards accessibilityLabel to the native DrumPicker view', () => {
    render(<DrumPicker items={['A', 'B']} accessibilityLabel="Size" />);
    expect(getLatestNativeDrumPickerProps()?.accessibilityLabel).toBe('Size');
  });

  it('omits accessibilityLabel when not provided (native picks its own)', () => {
    render(<DrumPicker items={['A', 'B']} />);
    expect(
      getLatestNativeDrumPickerProps()?.accessibilityLabel
    ).toBeUndefined();
  });

  it('DateDrumPicker labels each column distinctly by default', () => {
    render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 1, month: 1, year: 2024 }}
      />
    );
    const labels = getNativePickers().map(
      (p) => p.props.accessibilityLabel
    );
    expect(labels).toEqual(['Day', 'Month', 'Year']);
  });

  it('DateDrumPicker honors custom columnAccessibilityLabels', () => {
    render(
      <DateDrumPicker
        mode="day-month"
        value={{ day: 1, month: 1, year: 2024 }}
        columnAccessibilityLabels={{ day: 'Día', month: 'Mes' }}
      />
    );
    const labels = getNativePickers().map(
      (p) => p.props.accessibilityLabel
    );
    expect(labels).toEqual(['Día', 'Mes']);
  });

  it('TimeDrumPicker labels each column distinctly by default', () => {
    render(
      <TimeDrumPicker
        mode="hour-minute-second-period"
        value={{ hour: 9, minute: 0, second: 0 }}
      />
    );
    const labels = getNativePickers().map(
      (p) => p.props.accessibilityLabel
    );
    expect(labels).toEqual(['Hour', 'Minute', 'Second', 'AM/PM']);
  });

  it('TimeDrumPicker honors custom columnAccessibilityLabels', () => {
    render(
      <TimeDrumPicker
        mode="hour-minute"
        value={{ hour: 9, minute: 0 }}
        columnAccessibilityLabels={{ hour: 'Часы', minute: 'Минуты' }}
      />
    );
    const labels = getNativePickers().map(
      (p) => p.props.accessibilityLabel
    );
    expect(labels).toEqual(['Часы', 'Минуты']);
  });
});
