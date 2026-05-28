import React from 'react';
import { render } from '@testing-library/react-native';
import { DrumPicker } from '../DrumPicker.native';
import DrumPickerNativeComponent from '../DrumPickerViewNativeComponent';
import {
  fireNativeDrumPickerChange,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';

const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

describe('circular', () => {
  beforeEach(() => resetNativeDrumPickerMocks());

  it('sends multiplied items array to native when circular', () => {
    const { UNSAFE_getByType } = render(
      <DrumPicker circular items={MINUTES} selectedIndex={0} onChange={() => {}} />
    );
    const native = UNSAFE_getByType(DrumPickerNativeComponent);
    expect(native.props.items.length).toBe(MINUTES.length * 200);
  });

  it('sends original items array when not circular', () => {
    const { UNSAFE_getByType } = render(
      <DrumPicker items={MINUTES} selectedIndex={0} onChange={() => {}} />
    );
    const native = UNSAFE_getByType(DrumPickerNativeComponent);
    expect(native.props.items.length).toBe(MINUTES.length);
  });

  it('initial selectedIndex is at center of multiplied array', () => {
    const { UNSAFE_getByType } = render(
      <DrumPicker circular items={MINUTES} selectedIndex={5} onChange={() => {}} />
    );
    const native = UNSAFE_getByType(DrumPickerNativeComponent);
    const expectedCenter = Math.floor(200 / 2) * 60 + 5;
    expect(native.props.selectedIndex).toBe(expectedCenter);
  });

  it('onChange remaps virtual index to real index', () => {
    const onChange = jest.fn();
    render(<DrumPicker circular items={MINUTES} onChange={onChange} />);
    const virtualIndex = 60 + 5;
    fireNativeDrumPickerChange(virtualIndex, '05');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({
          index: 5,
          value: '05',
        }),
      })
    );
  });

  it('onChange wraps index at end of real list', () => {
    const onChange = jest.fn();
    render(<DrumPicker circular items={MINUTES} onChange={onChange} />);
    const virtualIndex = 199 * 60 + 1;
    fireNativeDrumPickerChange(virtualIndex, '00');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ index: 1 }),
      })
    );
  });

  it('circular with single item does not crash', () => {
    expect(() =>
      render(<DrumPicker circular items={['only']} onChange={() => {}} />)
    ).not.toThrow();
  });

  it('dedup works across repetitions', () => {
    const onChange = jest.fn();
    render(<DrumPicker circular items={MINUTES} onChange={onChange} />);
    fireNativeDrumPickerChange(60 + 5, '05');
    fireNativeDrumPickerChange(120 + 5, '05');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
