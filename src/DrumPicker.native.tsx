import { StyleSheet } from 'react-native';
import DrumPickerNative from './DrumPickerViewNativeComponent';
import type { DrumPickerProps } from './types';

const DEFAULTS = {
  selectedIndex: 0,
  itemHeight: 44,
  visibleItemCount: 5,
  textColor: '#9CA3AF',
  selectedTextColor: '#111827',
  textSize: 18,
  selectedTextSize: 22,
} as const;

export function DrumPicker({
  items,
  selectedIndex = DEFAULTS.selectedIndex,
  itemHeight = DEFAULTS.itemHeight,
  visibleItemCount = DEFAULTS.visibleItemCount,
  textColor = DEFAULTS.textColor,
  selectedTextColor = DEFAULTS.selectedTextColor,
  textSize = DEFAULTS.textSize,
  selectedTextSize = DEFAULTS.selectedTextSize,
  onChange,
  style,
}: DrumPickerProps) {
  const pickerHeight = itemHeight * visibleItemCount;
  const pickerStyle = StyleSheet.flatten([
    {
      height: pickerHeight,
    },
    style,
  ]);

  return (
    <DrumPickerNative
      collapsable={false}
      items={items}
      selectedIndex={selectedIndex}
      itemHeight={itemHeight}
      visibleItemCount={visibleItemCount}
      textColor={textColor}
      selectedTextColor={selectedTextColor}
      textSize={textSize}
      selectedTextSize={selectedTextSize}
      onValueChange={onChange}
      style={pickerStyle}
    />
  );
}
