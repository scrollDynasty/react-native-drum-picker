import { act, render } from '@testing-library/react-native';
import React from 'react';
import {
  fireNativeDrumPickerChange,
  getLatestNativeDrumPickerProps,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';
import { DrumPicker } from '../DrumPicker.native';
import { withVirtualized } from '../withVirtualized';

const VirtualizedDrumPicker = withVirtualized(DrumPicker);

const CITIES = Array.from({ length: 1000 }, (_, i) => `City ${i}`);

describe('withVirtualized', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it('renders only a window of items, not all 1000', () => {
    render(
      <VirtualizedDrumPicker
        items={CITIES}
        selectedIndex={0}
        windowSize={20}
        onChange={() => {}}
      />
    );
    const props = getLatestNativeDrumPickerProps();
    expect(props?.items?.length).toBeLessThanOrEqual(41);
  });

  it('remaps local index to real index in onChange', () => {
    const onChange = jest.fn();
    render(
      <VirtualizedDrumPicker
        items={CITIES}
        selectedIndex={500}
        windowSize={20}
        onChange={onChange}
      />
    );
    act(() => {
      fireNativeDrumPickerChange(5, 'City 485');
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ index: 485, value: 'City 485' }),
      })
    );
  });

  it('slides window when selection nears edge', () => {
    const onChange = jest.fn();
    render(
      <VirtualizedDrumPicker
        items={CITIES}
        selectedIndex={500}
        windowSize={20}
        onChange={onChange}
      />
    );
    act(() => {
      fireNativeDrumPickerChange(0, 'City 480');
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ index: 480 }),
      })
    );
  });

  it('clamps window at list start (no negative indices)', () => {
    expect(() =>
      render(
        <VirtualizedDrumPicker
          items={CITIES}
          selectedIndex={0}
          windowSize={20}
          onChange={() => {}}
        />
      )
    ).not.toThrow();
    expect(getLatestNativeDrumPickerProps()?.items?.[0]).toBe('City 0');
  });

  it('clamps window at list end', () => {
    render(
      <VirtualizedDrumPicker
        items={CITIES}
        selectedIndex={999}
        windowSize={20}
        onChange={() => {}}
      />
    );
    const props = getLatestNativeDrumPickerProps();
    expect(props?.items?.length).toBeLessThanOrEqual(41);
    expect(props?.items?.[props.items.length - 1]).toBe('City 999');
  });

  it('displayName is set correctly', () => {
    expect(VirtualizedDrumPicker.displayName).toBe(
      'withVirtualized(DrumPicker)'
    );
  });

  it('forwards enableScrollByTapOnItem to the wrapped picker', () => {
    render(
      <VirtualizedDrumPicker
        items={CITIES}
        selectedIndex={0}
        enableScrollByTapOnItem
        onChange={() => {}}
      />
    );
    expect(getLatestNativeDrumPickerProps()?.enableScrollByTapOnItem).toBe(
      true
    );
  });

  it('works with string array (backward compat)', () => {
    const onChange = jest.fn();
    render(
      <VirtualizedDrumPicker
        items={['A', 'B', 'C']}
        selectedIndex={0}
        onChange={onChange}
      />
    );
    act(() => {
      fireNativeDrumPickerChange(1, 'B');
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ index: 1, value: 'B' }),
      })
    );
  });
});
