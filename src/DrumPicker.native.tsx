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
  enableScrollByTapOnItem: false,
} as const;

/**
 * Render a configurable drum-style picker control.
 *
 * Renders a native drum picker with provided items and visual/behavioral props, preventing duplicate change events when the selected index does not change.
 *
 * @param items - Array of picker items to display.
 * @param selectedIndex - Index of the currently selected item.
 * @param onChange - Callback invoked when the selected index changes; receives the native change event.
 * @param enableScrollByTapOnItem - When `true`, tapping an item scrolls it into selection.
 * @param style - Optional style overrides applied to the picker container.
 * @param testID - Optional test identifier forwarded to the native component.
 * @returns A React element that mounts the native drum picker configured with the given props.
 */
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
  enableScrollByTapOnItem = DEFAULTS.enableScrollByTapOnItem,
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
      enableScrollByTapOnItem={enableScrollByTapOnItem}
      onValueChange={handleValueChange}
      style={pickerStyle}
    />
  );
}
