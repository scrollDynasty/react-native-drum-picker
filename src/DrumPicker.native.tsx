import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import DrumPickerNative from './DrumPickerViewNativeComponent';
import type { DrumPickerChangeEventPayload } from './DrumPickerViewNativeComponent';
import { DRUM_PICKER_DEFAULTS as DEFAULTS } from './drumPickerDefaults';
import { resolveDrumPickerStyle } from './drumPickerLayout';
import {
  getItemLabel,
  getItemValue,
  type DrumPickerChangeEvent,
  type DrumPickerProps,
} from './types';

export function DrumPicker<T = string>({
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
  accessibilityLabel,
  onChange,
  style,
  testID,
}: DrumPickerProps<T>) {
  const pickerStyle = resolveDrumPickerStyle(
    itemHeight,
    visibleItemCount,
    style
  );

  // Native only understands strings — extract labels once per items change.
  const labels = useMemo(() => items.map(getItemLabel), [items]);

  // Keep the latest items array in a ref so onValueChange can look up the
  // resolved value without re-subscribing every render.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const lastEmittedIndexRef = useRef(selectedIndex);
  useEffect(() => {
    lastEmittedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const handleValueChange = useCallback(
    (event: NativeSyntheticEvent<DrumPickerChangeEventPayload>) => {
      const index = event.nativeEvent.index;
      if (index === lastEmittedIndexRef.current) {
        return;
      }
      lastEmittedIndexRef.current = index;
      if (!onChange) {
        return;
      }
      const currentItems = itemsRef.current;
      const sourceItem =
        index >= 0 && index < currentItems.length
          ? currentItems[index]
          : undefined;
      const enriched: NativeSyntheticEvent<DrumPickerChangeEvent<T>> = {
        ...event,
        nativeEvent: {
          ...event.nativeEvent,
          item:
            sourceItem !== undefined
              ? getItemValue<T>(sourceItem)
              : (event.nativeEvent.value as unknown as T),
        },
      };
      onChange(enriched);
    },
    [onChange]
  );

  return (
    <DrumPickerNative
      {...(testID != null ? { testID } : {})}
      {...(accessibilityLabel != null ? { accessibilityLabel } : {})}
      collapsable={false}
      items={labels}
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
