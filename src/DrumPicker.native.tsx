import { useCallback, useEffect, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import DrumPickerNative from './DrumPickerViewNativeComponent';
import { resolveDrumPickerStyle } from './drumPickerLayout';
import type { DrumPickerChangeEvent, DrumPickerProps } from './types';

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
  hapticFeedback: false,
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
  hapticFeedback = DEFAULTS.hapticFeedback,
  onChange,
  style,
  testID,
}: DrumPickerProps) {
  const pickerStyle = resolveDrumPickerStyle(
    itemHeight,
    visibleItemCount,
    style
  );

  const lastEmittedIndexRef = useRef(selectedIndex);
  useEffect(() => {
    lastEmittedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const handleValueChange = useCallback(
    (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
      const index = event.nativeEvent.index;
      if (index === lastEmittedIndexRef.current) {
        return;
      }
      lastEmittedIndexRef.current = index;
      onChange?.(event);
    },
    [onChange]
  );

  return (
    <DrumPickerNative
      {...(testID != null ? { testID } : {})}
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
      hapticFeedback={hapticFeedback}
      onValueChange={handleValueChange}
      style={pickerStyle}
    />
  );
}
