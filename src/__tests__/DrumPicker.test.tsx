import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import {
  fireNativeDrumPickerChange,
  getLatestNativeDrumPickerProps,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';
import { DrumPicker } from '../DrumPicker.native';

describe('DrumPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it('renders without crashing with minimal props', () => {
    expect(() =>
      render(<DrumPicker items={['One', 'Two', 'Three']} />)
    ).not.toThrow();
  });

  it('applies default prop values correctly', () => {
    render(<DrumPicker items={['A', 'B']} />);
    const props = getLatestNativeDrumPickerProps();
    expect(props?.selectedIndex).toBe(0);
    expect(props?.itemHeight).toBe(44);
    expect(props?.visibleItemCount).toBe(5);
    expect(props?.showSelectionIndicator).toBe(true);
    expect(props?.hapticFeedback).toBe(false);
  });

  it('calls onChange with correct index and value when event fires', () => {
    const onChange = jest.fn();
    render(
      <DrumPicker items={['Alpha', 'Beta', 'Gamma']} onChange={onChange} />
    );
    fireNativeDrumPickerChange(1, 'Beta');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].nativeEvent).toEqual({
      index: 1,
      value: 'Beta',
    });
  });

  it('does not call onChange when index does not change', () => {
    const onChange = jest.fn();
    render(
      <DrumPicker
        items={['Alpha', 'Beta']}
        selectedIndex={1}
        onChange={onChange}
      />
    );
    fireNativeDrumPickerChange(1, 'Beta');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles empty items array gracefully', () => {
    expect(() => render(<DrumPicker items={[]} />)).not.toThrow();
    expect(getLatestNativeDrumPickerProps()?.items).toEqual([]);
  });

  it('passes controlled selectedIndex updates to native', () => {
    const { rerender } = render(
      <DrumPicker items={['A', 'B', 'C']} selectedIndex={0} />
    );
    rerender(<DrumPicker items={['A', 'B', 'C']} selectedIndex={2} />);
    expect(getLatestNativeDrumPickerProps()?.selectedIndex).toBe(2);
  });

  it('passes hapticFeedback to native component', () => {
    render(<DrumPicker items={['A']} hapticFeedback />);
    expect(getLatestNativeDrumPickerProps()?.hapticFeedback).toBe(true);
  });
});

describe('enableScrollByTapOnItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it('passes enableScrollByTapOnItem=false by default', () => {
    render(<DrumPicker items={['A', 'B', 'C']} onChange={() => {}} />);
    expect(getLatestNativeDrumPickerProps()?.enableScrollByTapOnItem).toBe(
      false
    );
  });

  it('passes enableScrollByTapOnItem=true when set', () => {
    render(
      <DrumPicker
        items={['A', 'B', 'C']}
        enableScrollByTapOnItem
        onChange={() => {}}
      />
    );
    expect(getLatestNativeDrumPickerProps()?.enableScrollByTapOnItem).toBe(
      true
    );
  });
});

describe('disabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNativeDrumPickerMocks();
  });

  it('passes disabled=false by default', () => {
    render(<DrumPicker items={['A', 'B', 'C']} />);
    expect(getLatestNativeDrumPickerProps()?.disabled).toBe(false);
  });

  it('passes disabled=true when set', () => {
    render(<DrumPicker items={['A', 'B', 'C']} disabled />);
    expect(getLatestNativeDrumPickerProps()?.disabled).toBe(true);
  });

  it('forwards disabled through the renderItem path', () => {
    render(
      <DrumPicker
        items={['A', 'B', 'C']}
        disabled
        renderItem={({ label }) => <Text>{label}</Text>}
      />
    );
    expect(getLatestNativeDrumPickerProps()?.disabled).toBe(true);
  });

  it('still follows a controlled selectedIndex while disabled', () => {
    const { rerender } = render(
      <DrumPicker items={['A', 'B', 'C']} selectedIndex={0} disabled />
    );
    rerender(<DrumPicker items={['A', 'B', 'C']} selectedIndex={2} disabled />);
    expect(getLatestNativeDrumPickerProps()?.selectedIndex).toBe(2);
  });
});
