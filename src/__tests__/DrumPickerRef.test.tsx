import React, { createRef } from 'react';
import { act, render } from '@testing-library/react-native';
import {
  fireNativeDrumPickerChange,
  getLatestNativeDrumPickerProps,
} from '../__mocks__/DrumPickerViewNativeComponent';
import { DrumPicker } from '../DrumPicker.native';
import type { DrumPickerRef } from '../types';

const ITEMS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'];

describe('DrumPickerRef', () => {
  it('ref is not null after render', () => {
    const ref = createRef<DrumPickerRef>();
    render(<DrumPicker ref={ref} items={ITEMS} onChange={() => {}} />);
    expect(ref.current).not.toBeNull();
  });

  it('scrollToIndex updates currentIndex', () => {
    const ref = createRef<DrumPickerRef>();
    render(
      <DrumPicker
        ref={ref}
        items={ITEMS}
        selectedIndex={0}
        onChange={() => {}}
      />
    );
    act(() => {
      ref.current?.scrollToIndex(3);
    });
    expect(ref.current?.getCurrentIndex()).toBe(3);
    expect(getLatestNativeDrumPickerProps()?.selectedIndex).toBe(3);
  });

  it('scrollToIndex clamps out-of-bounds high', () => {
    const ref = createRef<DrumPickerRef>();
    render(<DrumPicker ref={ref} items={ITEMS} onChange={() => {}} />);
    act(() => {
      ref.current?.scrollToIndex(999);
    });
    expect(ref.current?.getCurrentIndex()).toBe(4);
  });

  it('scrollToIndex clamps out-of-bounds low', () => {
    const ref = createRef<DrumPickerRef>();
    render(<DrumPicker ref={ref} items={ITEMS} onChange={() => {}} />);
    act(() => {
      ref.current?.scrollToIndex(-5);
    });
    expect(ref.current?.getCurrentIndex()).toBe(0);
  });

  it('scrollToValue finds correct index', () => {
    const ref = createRef<DrumPickerRef>();
    render(<DrumPicker ref={ref} items={ITEMS} onChange={() => {}} />);
    act(() => {
      ref.current?.scrollToValue('Gamma');
    });
    expect(ref.current?.getCurrentIndex()).toBe(2);
    expect(ref.current?.getCurrentValue()).toBe('Gamma');
  });

  it('scrollToValue is no-op for unknown value', () => {
    const ref = createRef<DrumPickerRef>();
    render(
      <DrumPicker
        ref={ref}
        items={ITEMS}
        selectedIndex={1}
        onChange={() => {}}
      />
    );
    act(() => {
      ref.current?.scrollToValue('UNKNOWN');
    });
    expect(ref.current?.getCurrentIndex()).toBe(1);
  });

  it('getCurrentValue returns correct string', () => {
    const ref = createRef<DrumPickerRef>();
    render(
      <DrumPicker
        ref={ref}
        items={ITEMS}
        selectedIndex={2}
        onChange={() => {}}
      />
    );
    expect(ref.current?.getCurrentValue()).toBe('Gamma');
  });

  it('scrollToIndex fires onChange for controlled picker', () => {
    const onChange = jest.fn();
    const ref = createRef<DrumPickerRef>();
    const { rerender } = render(
      <DrumPicker
        ref={ref}
        items={ITEMS}
        selectedIndex={0}
        onChange={onChange}
      />
    );
    act(() => {
      ref.current?.scrollToIndex(3);
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: { index: 3, value: 'Delta' },
      })
    );
    rerender(
      <DrumPicker
        ref={ref}
        items={ITEMS}
        selectedIndex={3}
        onChange={onChange}
      />
    );
    expect(ref.current?.getCurrentIndex()).toBe(3);
  });

  it('clamps refs when items shrink', () => {
    const ref = createRef<DrumPickerRef>();
    const { rerender } = render(
      <DrumPicker
        ref={ref}
        items={ITEMS}
        selectedIndex={4}
        onChange={() => {}}
      />
    );
    expect(ref.current?.getCurrentIndex()).toBe(4);
    rerender(
      <DrumPicker
        ref={ref}
        items={['Only']}
        selectedIndex={4}
        onChange={() => {}}
      />
    );
    expect(ref.current?.getCurrentIndex()).toBe(0);
    expect(ref.current?.getCurrentValue()).toBe('Only');
    expect(getLatestNativeDrumPickerProps()?.selectedIndex).toBe(0);
  });

  it('currentIndex stays in sync after onChange', () => {
    const ref = createRef<DrumPickerRef>();
    render(<DrumPicker ref={ref} items={ITEMS} onChange={() => {}} />);
    act(() => {
      fireNativeDrumPickerChange(4, 'Echo');
    });
    expect(ref.current?.getCurrentIndex()).toBe(4);
    expect(ref.current?.getCurrentValue()).toBe('Echo');
  });
});
