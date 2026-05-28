import React, { createRef } from 'react';
import { act, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
// Jest resolves `.native` by default; import the web stub explicitly.
import { DrumPicker } from '../DrumPicker.tsx';
import type { DrumPickerRef } from '../types';

const ITEMS = ['Alpha', 'Beta', 'Gamma'];

describe('DrumPicker (web stub)', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<DrumPicker items={ITEMS} selectedIndex={1} />)
    ).not.toThrow();
  });

  it('shows the selected value', () => {
    const { getByText } = render(
      <DrumPicker items={ITEMS} selectedIndex={2} />
    );
    expect(getByText('Gamma')).toBeTruthy();
  });

  it('scrollToIndex via ref updates selection and fires onChange', () => {
    const onChange = jest.fn();
    const ref = createRef<DrumPickerRef>();
    const { getByText } = render(
      <DrumPicker ref={ref} items={ITEMS} onChange={onChange} />
    );
    act(() => {
      ref.current?.scrollToIndex(1);
    });
    expect(ref.current?.getCurrentIndex()).toBe(1);
    expect(getByText('Beta')).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: { index: 1, value: 'Beta' },
      })
    );
  });

  it('scrollToValue via ref finds the item', () => {
    const ref = createRef<DrumPickerRef>();
    render(<DrumPicker ref={ref} items={ITEMS} onChange={() => {}} />);
    act(() => {
      ref.current?.scrollToValue('Alpha');
    });
    expect(ref.current?.getCurrentValue()).toBe('Alpha');
  });

  it('supports renderItem and updates centered row via ref', () => {
    const onChange = jest.fn();
    const ref = createRef<DrumPickerRef>();
    const { getByText } = render(
      <DrumPicker
        ref={ref}
        items={ITEMS}
        selectedIndex={0}
        onChange={onChange}
        renderItem={({ item, isSelected }) => (
          <Pressable>
            <Text>{`${item}-${isSelected ? 'selected' : 'idle'}`}</Text>
          </Pressable>
        )}
      />
    );

    expect(getByText('Alpha-selected')).toBeTruthy();
    act(() => {
      ref.current?.scrollToIndex(1);
    });
    expect(getByText('Beta-selected')).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: { index: 1, value: 'Beta' },
      })
    );
  });

  it('supports renderItem with object items and label mapping', () => {
    const items = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
      { label: 'Three', value: 3 },
    ];
    const ref = createRef<DrumPickerRef>();
    const { getByText } = render(
      <DrumPicker
        ref={ref}
        items={items}
        selectedIndex={0}
        renderItem={({ label, isSelected }) => (
          <Text>{`${label}-${isSelected ? 'selected' : 'idle'}`}</Text>
        )}
      />
    );

    expect(getByText('One-selected')).toBeTruthy();
    act(() => {
      ref.current?.scrollToIndex(1);
    });
    expect(getByText('Two-selected')).toBeTruthy();
    expect(ref.current?.getCurrentValue()).toBe('Two');
  });
});
