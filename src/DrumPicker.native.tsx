import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { ElementRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import DrumPickerNative from './DrumPickerViewNativeComponent';
import { resolveDrumPickerStyle } from './drumPickerLayout';
import type {
  DrumPickerChangeEvent,
  DrumPickerProps,
  DrumPickerRef,
} from './types';

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

function clampIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, itemCount - 1));
}

export const DrumPicker = forwardRef<DrumPickerRef, DrumPickerProps>(
  function DrumPicker(
    {
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
      onValueChanging,
      onChange,
      style,
      testID,
    },
    ref
  ) {
    const pickerStyle = resolveDrumPickerStyle(
      itemHeight,
      visibleItemCount,
      style
    );

    const nativeRef = useRef<ElementRef<typeof DrumPickerNative>>(null);
    const resolvedSelectedIndex = selectedIndex ?? DEFAULTS.selectedIndex;
    const initialClampedIndex = clampIndex(resolvedSelectedIndex, items.length);
    const currentIndexRef = useRef(initialClampedIndex);
    const lastEmittedIndexRef = useRef(initialClampedIndex);
    const [imperativeScroll, setImperativeScroll] = useState<{
      index: number;
      animated: boolean;
    } | null>(null);

    const clampedSelectedIndex = clampIndex(
      resolvedSelectedIndex,
      items.length
    );
    const nativeSelectedIndex = imperativeScroll?.index ?? clampedSelectedIndex;
    const scrollAnimated = imperativeScroll?.animated ?? false;

    useEffect(() => {
      const clamped = clampIndex(
        selectedIndex ?? DEFAULTS.selectedIndex,
        items.length
      );
      currentIndexRef.current = clamped;
      lastEmittedIndexRef.current = clamped;
      setImperativeScroll(null);
    }, [selectedIndex, items.length]);

    const applyScrollToIndex = useCallback(
      (index: number, animated: boolean) => {
        const clamped = clampIndex(index, items.length);
        const previousEmitted = lastEmittedIndexRef.current;
        currentIndexRef.current = clamped;
        lastEmittedIndexRef.current = clamped;
        setImperativeScroll({ index: clamped, animated });
        nativeRef.current?.setNativeProps?.({
          selectedIndex: clamped,
          scrollAnimated: animated,
        });
        if (onChange != null && clamped !== previousEmitted) {
          onChange({
            nativeEvent: {
              index: clamped,
              value: items[clamped] ?? '',
            },
          } as NativeSyntheticEvent<DrumPickerChangeEvent>);
        }
      },
      [items, onChange]
    );

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex(index, options = {}) {
          applyScrollToIndex(index, options.animated ?? true);
        },
        scrollToValue(value, options = {}) {
          const index = items.findIndex((item) => item === value);
          if (index === -1) {
            return;
          }
          applyScrollToIndex(index, options.animated ?? true);
        },
        getCurrentIndex() {
          return clampIndex(currentIndexRef.current, items.length);
        },
        getCurrentValue() {
          const index = clampIndex(currentIndexRef.current, items.length);
          return items[index] ?? '';
        },
      }),
      [applyScrollToIndex, items]
    );

    const handleValueChange = useCallback(
      (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        const index = event.nativeEvent.index;
        currentIndexRef.current = index;
        if (index === lastEmittedIndexRef.current) {
          return;
        }
        lastEmittedIndexRef.current = index;
        onChange?.(event);
      },
      [onChange]
    );

    const handleValueChanging = useCallback(
      (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        if (onValueChanging == null) {
          return;
        }
        const { index } = event.nativeEvent;
        const value = items[index] ?? event.nativeEvent.value;
        onValueChanging({
          ...event,
          nativeEvent: { index, value },
        });
      },
      [items, onValueChanging]
    );

    return (
      <DrumPickerNative
        ref={nativeRef}
        {...(testID != null ? { testID } : {})}
        collapsable={false}
        items={items}
        selectedIndex={nativeSelectedIndex}
        scrollAnimated={scrollAnimated}
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
        onValueChangingEnabled={onValueChanging != null}
        onValueChanging={
          onValueChanging != null ? handleValueChanging : undefined
        }
        onValueChange={handleValueChange}
        style={pickerStyle}
      />
    );
  }
);

DrumPicker.displayName = 'DrumPicker';
