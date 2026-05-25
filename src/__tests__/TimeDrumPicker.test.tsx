import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { resetNativeDrumPickerMocks } from '../__mocks__/DrumPickerViewNativeComponent';
import { TimeDrumPicker } from '../TimeDrumPicker';

const MODES = [
  'hour',
  'minute',
  'hour-minute',
  'hour-minute-second',
  'hour-minute-period',
  'hour-minute-second-period',
] as const;

function getNativePickers() {
  return screen.getAllByTestId('drum-picker-native');
}

describe('TimeDrumPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it.each(MODES)('renders mode %s', (mode) => {
    const { toJSON } = render(
      <TimeDrumPicker mode={mode} value={{ hour: 9, minute: 30, second: 15 }} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the correct number of columns per mode', () => {
    const cases: Array<[(typeof MODES)[number], number]> = [
      ['hour', 1],
      ['minute', 1],
      ['hour-minute', 2],
      ['hour-minute-second', 3],
      ['hour-minute-period', 3],
      ['hour-minute-second-period', 4],
    ];
    for (const [mode, count] of cases) {
      const { unmount } = render(
        <TimeDrumPicker mode={mode} value={{ hour: 10, minute: 0 }} />
      );
      expect(getNativePickers()).toHaveLength(count);
      unmount();
    }
  });

  it('uses 24-hour items by default for hour-minute', () => {
    render(
      <TimeDrumPicker mode="hour-minute" value={{ hour: 0, minute: 0 }} />
    );
    const [hourPicker] = getNativePickers();
    expect(hourPicker.props.items).toHaveLength(24);
    expect(hourPicker.props.items[0]).toBe('00');
  });

  it('uses 12-hour items for period modes', () => {
    render(
      <TimeDrumPicker
        mode="hour-minute-period"
        value={{ hour: 13, minute: 0 }}
      />
    );
    const [hourPicker, , periodPicker] = getNativePickers();
    expect(hourPicker.props.items).toHaveLength(12);
    expect(periodPicker.props.items).toEqual(['AM', 'PM']);
  });

  it('snaps initial controlled minute to the given interval and notifies', () => {
    const onChange = jest.fn();
    render(
      <TimeDrumPicker
        mode="hour-minute"
        value={{ hour: 9, minute: 53 }}
        minuteInterval={15}
        onChange={onChange}
      />
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ hour: 9, minute: 45 })
    );
  });

  it('does not re-notify when controlled value is already in range', () => {
    const onChange = jest.fn();
    render(
      <TimeDrumPicker
        mode="hour-minute"
        value={{ hour: 9, minute: 30 }}
        onChange={onChange}
      />
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits a 24-hour value when the user spins the hour column in 24h mode', () => {
    const onChange = jest.fn();
    render(
      <TimeDrumPicker
        mode="hour-minute"
        value={{ hour: 0, minute: 0 }}
        onChange={onChange}
      />
    );
    const [hourPicker] = getNativePickers();
    act(() => {
      hourPicker.props.onValueChange?.({
        nativeEvent: { index: 14, value: '14' },
      });
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ hour: 14, minute: 0 })
    );
  });

  it('translates 12h hour spin to a 24h hour, preserving AM', () => {
    const onChange = jest.fn();
    render(
      <TimeDrumPicker
        mode="hour-minute-period"
        value={{ hour: 9, minute: 0 }}
        onChange={onChange}
      />
    );
    const [hourPicker] = getNativePickers();
    act(() => {
      hourPicker.props.onValueChange?.({
        nativeEvent: { index: 2, value: '03' },
      });
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ hour: 3 })
    );
  });

  it('flipping AM→PM keeps the 12h hour and converts to PM in 24h', () => {
    const onChange = jest.fn();
    render(
      <TimeDrumPicker
        mode="hour-minute-period"
        value={{ hour: 3, minute: 0 }}
        onChange={onChange}
      />
    );
    const pickers = getNativePickers();
    const periodPicker = pickers[pickers.length - 1];
    act(() => {
      periodPicker.props.onValueChange?.({
        nativeEvent: { index: 1, value: 'PM' },
      });
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ hour: 15 })
    );
  });

  it('emits minutes snapped to the configured interval when spun', () => {
    const onChange = jest.fn();
    render(
      <TimeDrumPicker
        mode="hour-minute"
        value={{ hour: 9, minute: 0 }}
        minuteInterval={15}
        onChange={onChange}
      />
    );
    const [, minutePicker] = getNativePickers();
    act(() => {
      minutePicker.props.onValueChange?.({
        nativeEvent: { index: 2, value: '30' },
      });
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ minute: 30 })
    );
  });

  it('updates internal state in uncontrolled mode', () => {
    const onChange = jest.fn();
    render(<TimeDrumPicker mode="hour" onChange={onChange} />);
    const [hourPicker] = getNativePickers();
    act(() => {
      hourPicker.props.onValueChange?.({
        nativeEvent: { index: 7, value: '07' },
      });
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ hour: 7 })
    );
  });

  it('honors custom AM/PM labels and exposes them to the period column', () => {
    render(
      <TimeDrumPicker
        mode="hour-minute-period"
        value={{ hour: 9, minute: 0 }}
        amLabel="오전"
        pmLabel="오후"
      />
    );
    const pickers = getNativePickers();
    const periodPicker = pickers[pickers.length - 1];
    expect(periodPicker.props.items).toEqual(['오전', '오후']);
  });

  it('passes hapticFeedback through to every column', () => {
    render(
      <TimeDrumPicker
        mode="hour-minute-second"
        value={{ hour: 1, minute: 1, second: 1 }}
        hapticFeedback
      />
    );
    for (const picker of getNativePickers()) {
      expect(picker.props.hapticFeedback).toBe(true);
    }
  });

  it('forwards columnTestIDs to the right column', () => {
    render(
      <TimeDrumPicker
        mode="hour-minute-period"
        value={{ hour: 9, minute: 0 }}
        columnTestIDs={{ hour: 'h', minute: 'm', period: 'p' }}
      />
    );
    expect(screen.getByTestId('h')).toBeTruthy();
    expect(screen.getByTestId('m')).toBeTruthy();
    expect(screen.getByTestId('p')).toBeTruthy();
  });
});
