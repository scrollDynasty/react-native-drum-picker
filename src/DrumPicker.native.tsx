import DrumPickerNative from './DrumPickerViewNativeComponent';
import { resolveDrumPickerStyle } from './drumPickerLayout';
import type { DrumPickerProps } from './types';

const DEFAULTS = {
  selectedIndex: 0,
  itemHeight: 44,
  visibleItemCount: 5,
  textColor: '#8E8E93',
  selectedTextColor: '#1C1C1E',
  textSize: 20,
  selectedTextSize: 22,
  showSelectionIndicator: true,
  selectionIndicatorColor: '#D1D1D6',
  selectionIndicatorHeight: 1,
  backgroundColor: 'transparent',
  itemBackgroundColor: 'transparent',
  containerBackgroundColor: 'transparent',
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
  showSelectionIndicator = DEFAULTS.showSelectionIndicator,
  selectionIndicatorColor = DEFAULTS.selectionIndicatorColor,
  selectionIndicatorHeight = DEFAULTS.selectionIndicatorHeight,
  backgroundColor = DEFAULTS.backgroundColor,
  itemBackgroundColor = DEFAULTS.itemBackgroundColor,
  containerBackgroundColor = DEFAULTS.containerBackgroundColor,
  onChange,
  style,
}: DrumPickerProps) {
  const pickerStyle = resolveDrumPickerStyle(
    itemHeight,
    visibleItemCount,
    style
  );

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
      showSelectionIndicator={showSelectionIndicator}
      selectionIndicatorColor={selectionIndicatorColor}
      selectionIndicatorHeight={selectionIndicatorHeight}
      backgroundColor={backgroundColor}
      itemBackgroundColor={itemBackgroundColor}
      containerBackgroundColor={containerBackgroundColor}
      onValueChange={onChange}
      style={pickerStyle}
    />
  );
}
