import React from 'react';
import { act, render } from '@testing-library/react-native';
import { DrumPicker } from '../DrumPicker.native';
import {
  fireNativeDrumPickerChange,
  fireNativeDrumPickerChanging,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';
import {
  usePickerGroup,
  usePickerGroupChangedEffect,
  usePickerGroupChangingEffect,
} from '../index';

const HOURS = ['00', '01', '02', '03', '04', '05', '06'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30'];

function TestTimePicker({
  onGroupChanged,
  onGroupChanging,
}: {
  onGroupChanged?: (e: unknown) => void;
  onGroupChanging?: (e: unknown) => void;
}) {
  const group = usePickerGroup();
  usePickerGroupChangedEffect(group, (e) => onGroupChanged?.(e));
  usePickerGroupChangingEffect(group, (e) => onGroupChanging?.(e));

  return (
    <>
      <DrumPicker
        testID="hours-picker"
        pickerGroup={group}
        pickerName="hours"
        items={HOURS}
        onChange={() => {}}
      />
      <DrumPicker
        testID="minutes-picker"
        pickerGroup={group}
        pickerName="minutes"
        items={MINUTES}
        onChange={() => {}}
      />
    </>
  );
}

describe('usePickerGroup', () => {
  beforeEach(() => {
    resetNativeDrumPickerMocks();
    jest.clearAllMocks();
  });

  it('usePickerGroupChangedEffect fires when any picker settles', () => {
    const onGroupChanged = jest.fn();
    render(<TestTimePicker onGroupChanged={onGroupChanged} />);

    act(() => {
      fireNativeDrumPickerChange(3, '15');
    });

    expect(onGroupChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        pickerName: 'minutes',
        index: 3,
        value: '15',
      })
    );
  });

  it('usePickerGroupChangingEffect fires during scroll', () => {
    const onGroupChanging = jest.fn();
    render(<TestTimePicker onGroupChanging={onGroupChanging} />);

    act(() => {
      fireNativeDrumPickerChanging(2, '10');
    });

    expect(onGroupChanging).toHaveBeenCalledWith(
      expect.objectContaining({
        pickerName: 'minutes',
        index: 2,
        value: '10',
      })
    );
  });

  it('own onChange still fires independently', () => {
    const ownOnChange = jest.fn();
    const group = {
      _register: jest.fn(() => () => {}),
      _notifyChanged: jest.fn(),
      _notifyChanging: jest.fn(),
      getState: jest.fn(() => ({})),
    };
    render(
      <DrumPicker
        pickerGroup={group}
        pickerName="test"
        items={HOURS}
        onChange={ownOnChange}
      />
    );

    act(() => {
      fireNativeDrumPickerChange(1, '01');
    });

    expect(ownOnChange).toHaveBeenCalledTimes(1);
    expect(group._notifyChanged).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({ pickerName: 'test', index: 1, value: '01' })
    );
  });

  it('getState returns current values', () => {
    let capturedGroup: ReturnType<typeof usePickerGroup> | undefined;
    function Capture() {
      const group = usePickerGroup();
      capturedGroup = group;
      return (
        <DrumPicker
          pickerGroup={group}
          pickerName="hours"
          items={HOURS}
          onChange={() => {}}
        />
      );
    }
    render(<Capture />);

    act(() => {
      fireNativeDrumPickerChange(4, '04');
    });

    expect(capturedGroup?.getState().hours).toEqual({ index: 4, value: '04' });
  });

  it('unregisters observers on unmount', () => {
    const onGroupChanged = jest.fn();
    const { unmount } = render(
      <TestTimePicker onGroupChanged={onGroupChanged} />
    );
    unmount();

    act(() => {
      fireNativeDrumPickerChange(1, '05');
    });

    expect(onGroupChanged).not.toHaveBeenCalled();
  });

  it('works without pickerGroup', () => {
    expect(() =>
      render(<DrumPicker items={HOURS} onChange={() => {}} />)
    ).not.toThrow();
  });
});
