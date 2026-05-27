import { render } from '@testing-library/react-native';
import React from 'react';
import {
  fireNativeDrumPickerChange,
  fireNativeDrumPickerChanging,
  getLatestNativeDrumPickerProps,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';
import { DrumPicker } from '../DrumPicker.native';

describe('onValueChanging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it('calls onValueChanging on scroll tick', () => {
    const onValueChanging = jest.fn();
    render(
      <DrumPicker
        items={['A', 'B', 'C']}
        onValueChanging={onValueChanging}
        onChange={() => {}}
      />
    );
    fireNativeDrumPickerChanging(1, 'B');
    expect(onValueChanging).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ index: 1, value: 'B' }),
      })
    );
  });

  it('does not call onValueChanging when settled (onChange fires instead)', () => {
    const onValueChanging = jest.fn();
    const onChange = jest.fn();
    render(
      <DrumPicker
        items={['A', 'B', 'C']}
        onValueChanging={onValueChanging}
        onChange={onChange}
      />
    );
    fireNativeDrumPickerChange(2, 'C');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChanging).not.toHaveBeenCalled();
  });

  it('works without onValueChanging prop', () => {
    const onChange = jest.fn();
    expect(() =>
      render(<DrumPicker items={['A', 'B', 'C']} onChange={onChange} />)
    ).not.toThrow();
  });

  it('does not pass onValueChangingEnabled=true without prop', () => {
    render(<DrumPicker items={['A', 'B', 'C']} onChange={() => {}} />);
    expect(getLatestNativeDrumPickerProps()?.onValueChangingEnabled).toBe(
      false
    );
  });

  it('passes onValueChangingEnabled=true when prop is provided', () => {
    render(
      <DrumPicker
        items={['A', 'B', 'C']}
        onValueChanging={() => {}}
        onChange={() => {}}
      />
    );
    expect(getLatestNativeDrumPickerProps()?.onValueChangingEnabled).toBe(true);
  });
});
