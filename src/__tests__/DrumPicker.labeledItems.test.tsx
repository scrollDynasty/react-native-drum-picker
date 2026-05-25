import { render } from '@testing-library/react-native';
import React from 'react';
import {
  fireNativeDrumPickerChange,
  getLatestNativeDrumPickerProps,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';
import { DrumPicker } from '../DrumPicker.native';

describe('DrumPicker — labeled items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it('passes only string labels to the native component when given labeled items', () => {
    render(
      <DrumPicker
        items={[
          { label: 'Small', value: 's' },
          { label: 'Medium', value: 'm' },
          { label: 'Large', value: 'l' },
        ]}
      />
    );
    expect(getLatestNativeDrumPickerProps()?.items).toEqual([
      'Small',
      'Medium',
      'Large',
    ]);
  });

  it('surfaces the resolved item on onChange.nativeEvent.item', () => {
    const onChange = jest.fn();
    render(
      <DrumPicker
        items={[
          { label: 'Small', value: 's' as const },
          { label: 'Medium', value: 'm' as const },
          { label: 'Large', value: 'l' as const },
        ]}
        onChange={onChange}
      />
    );
    fireNativeDrumPickerChange(2, 'Large');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].nativeEvent).toEqual({
      index: 2,
      value: 'Large',
      item: 'l',
    });
  });

  it('supports non-string item values (numbers, objects)', () => {
    type Country = { id: number; iso: string };
    const items: Array<{ label: string; value: Country }> = [
      { label: 'United States', value: { id: 1, iso: 'us' } },
      { label: 'Germany', value: { id: 2, iso: 'de' } },
    ];
    const onChange = jest.fn();
    render(<DrumPicker<Country> items={items} onChange={onChange} />);
    fireNativeDrumPickerChange(1, 'Germany');
    expect(onChange.mock.calls[0][0].nativeEvent.item).toEqual({
      id: 2,
      iso: 'de',
    });
  });

  it('still works with plain string items (back-compat)', () => {
    const onChange = jest.fn();
    render(
      <DrumPicker items={['Alpha', 'Beta', 'Gamma']} onChange={onChange} />
    );
    fireNativeDrumPickerChange(1, 'Beta');
    expect(onChange.mock.calls[0][0].nativeEvent).toEqual({
      index: 1,
      value: 'Beta',
      item: 'Beta',
    });
  });

  it('handles mixed string + labeled items', () => {
    const onChange = jest.fn();
    render(
      <DrumPicker
        items={['Plain', { label: 'Fancy', value: 'fancy-id' }]}
        onChange={onChange}
      />
    );
    expect(getLatestNativeDrumPickerProps()?.items).toEqual(['Plain', 'Fancy']);
    fireNativeDrumPickerChange(1, 'Fancy');
    expect(onChange.mock.calls[0][0].nativeEvent).toEqual({
      index: 1,
      value: 'Fancy',
      item: 'fancy-id',
    });
  });

  it('falls back to value when the native index is out of bounds', () => {
    const onChange = jest.fn();
    render(
      <DrumPicker
        items={[{ label: 'Only', value: 'only-id' }]}
        onChange={onChange}
      />
    );
    fireNativeDrumPickerChange(5, 'Stale');
    expect(onChange.mock.calls[0][0].nativeEvent.item).toBe('Stale');
  });
});
