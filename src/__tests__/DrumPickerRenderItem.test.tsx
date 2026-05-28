import React from 'react';
import { Text, View } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { DrumPicker } from '../DrumPicker.native';
import {
  fireNativeDrumPickerChange,
  fireNativeDrumPickerChanging,
  resetNativeDrumPickerMocks,
} from '../__mocks__/DrumPickerViewNativeComponent';

const ITEMS = ['Red', 'Green', 'Blue', 'Yellow', 'Purple'];

describe('DrumPicker renderItem', () => {
  beforeEach(() => {
    resetNativeDrumPickerMocks();
    jest.clearAllMocks();
  });

  it('renders custom renderItem for visible rows', () => {
    const { getAllByTestId } = render(
      <DrumPicker
        items={ITEMS}
        selectedIndex={0}
        renderItem={({ item, index }) => (
          <View testID={`custom-item-${index}`}>
            <Text>{item}</Text>
          </View>
        )}
      />
    );
    expect(getAllByTestId(/custom-item-/).length).toBeGreaterThan(0);
  });

  it('passes one selected item in initial visible window', () => {
    const selectedIndexes: number[] = [];
    render(
      <DrumPicker
        items={ITEMS}
        selectedIndex={2}
        visibleItemCount={5}
        renderItem={({ index, isSelected }) => {
          if (isSelected) {
            selectedIndexes.push(index);
          }
          return null;
        }}
      />
    );
    expect(selectedIndexes).toContain(2);
  });

  it('updates selected row while scrolling when onValueChanging is set', () => {
    const renderSpy = jest.fn(() => null);
    render(
      <DrumPicker
        items={ITEMS}
        selectedIndex={0}
        renderItem={renderSpy}
        onValueChanging={() => {}}
      />
    );
    act(() => {
      fireNativeDrumPickerChanging(3, 'Yellow');
    });
    const hadSelectedYellow = renderSpy.mock.calls.some(
      ([info]) => info.index === 3 && info.isSelected === true
    );
    expect(hadSelectedYellow).toBe(true);
  });

  it('renders without renderItem using native path', () => {
    expect(() => render(<DrumPicker items={ITEMS} />)).not.toThrow();
  });

  it('renderItem receives item, label, index, isSelected', () => {
    const renderSpy = jest.fn(() => null);
    render(
      <DrumPicker
        items={ITEMS}
        selectedIndex={1}
        visibleItemCount={3}
        renderItem={renderSpy}
      />
    );
    const centerCall = renderSpy.mock.calls
      .map(([info]) => info)
      .find((info) => info.isSelected);
    expect(centerCall).toMatchObject({
      item: 'Green',
      label: 'Green',
      index: 1,
      isSelected: true,
    });
  });

  it('works with labeled items', () => {
    const items = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
    ];
    const renderSpy = jest.fn(() => null);
    render(
      <DrumPicker items={items} selectedIndex={0} renderItem={renderSpy} />
    );
    const centerCall = renderSpy.mock.calls.find(([info]) => info.isSelected);
    expect(centerCall?.[0].label).toBe('One');
    expect(centerCall?.[0].item).toEqual({ label: 'One', value: 1 });
  });

  it('onChange fires with correct index when renderItem is used', () => {
    const onChange = jest.fn();
    render(
      <DrumPicker
        items={ITEMS}
        renderItem={({ item }) => <Text>{item}</Text>}
        onChange={onChange}
      />
    );
    act(() => {
      fireNativeDrumPickerChange(2, 'Blue');
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({
          index: 2,
          value: 'Blue',
        }),
      })
    );
  });
});
