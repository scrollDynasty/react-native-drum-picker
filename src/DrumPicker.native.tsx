import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { ElementRef, ReactElement, RefAttributes } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import DrumPickerNative from './DrumPickerViewNativeComponent';
import { DrumPickerWithRenderItem } from './DrumPickerWithRenderItem';
import { resolveDrumPickerStyle } from './drumPickerLayout';
import { getItemLabel } from './itemLabel';
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

type DrumPickerNativeBaseProps = DrumPickerProps<any> & {
  renderItem?: never;
};

export const DrumPickerNativeBase = forwardRef<
  DrumPickerRef,
  DrumPickerNativeBaseProps
>(function DrumPickerNativeBase(
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
    pickerGroup,
    pickerName,
    style,
    testID,
  },
  ref
) {
  const labels = items.map((item) => getItemLabel(item));
  const pickerStyle = resolveDrumPickerStyle(
    itemHeight,
    visibleItemCount,
    style
  );

  const nativeRef = useRef<ElementRef<typeof DrumPickerNative>>(null);
  const resolvedSelectedIndex = selectedIndex ?? DEFAULTS.selectedIndex;
  const initialClampedIndex = clampIndex(resolvedSelectedIndex, labels.length);
  const currentIndexRef = useRef(initialClampedIndex);
  const lastEmittedIndexRef = useRef(initialClampedIndex);
  const [imperativeScroll, setImperativeScroll] = useState<{
    index: number;
    animated: boolean;
  } | null>(null);

  const clampedSelectedIndex = clampIndex(resolvedSelectedIndex, labels.length);
  const nativeSelectedIndex = imperativeScroll?.index ?? clampedSelectedIndex;
  const scrollAnimated = imperativeScroll?.animated ?? false;

  useEffect(() => {
    const clamped = clampIndex(
      selectedIndex ?? DEFAULTS.selectedIndex,
      labels.length
    );
    currentIndexRef.current = clamped;
    lastEmittedIndexRef.current = clamped;
    setImperativeScroll(null);
  }, [selectedIndex, labels.length]);

  const applyScrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const clamped = clampIndex(index, labels.length);
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
            value: labels[clamped] ?? '',
          },
        } as NativeSyntheticEvent<DrumPickerChangeEvent>);
      }
    },
    [labels, onChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex(index, options = {}) {
        applyScrollToIndex(index, options.animated ?? true);
      },
      scrollToValue(value, options = {}) {
        const index = labels.findIndex((item) => item === value);
        if (index === -1) {
          return;
        }
        applyScrollToIndex(index, options.animated ?? true);
      },
      getCurrentIndex() {
        return clampIndex(currentIndexRef.current, labels.length);
      },
      getCurrentValue() {
        const index = clampIndex(currentIndexRef.current, labels.length);
        return labels[index] ?? '';
      },
    }),
    [applyScrollToIndex, labels]
  );

  useEffect(() => {
    if (__DEV__ && pickerGroup && !pickerName) {
      console.warn(
        '[DrumPicker] pickerGroup provided without pickerName. Add pickerName="uniqueName" to this picker.'
      );
    }
  }, [pickerGroup, pickerName]);

  useEffect(() => {
    if (!pickerGroup || !pickerName) {
      return;
    }
    const unregister = pickerGroup._register(pickerName, {
      onChanged: () => {},
      onChanging: () => {},
    });
    return unregister;
  }, [pickerGroup, pickerName]);

  const handleValueChange = useCallback(
    (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
      const index = event.nativeEvent.index;
      const value = labels[index] ?? event.nativeEvent.value;
      currentIndexRef.current = index;
      if (index === lastEmittedIndexRef.current) {
        return;
      }
      lastEmittedIndexRef.current = index;
      if (pickerGroup && pickerName) {
        pickerGroup._notifyChanged(pickerName, {
          pickerName,
          index,
          value,
          item: items[index] ?? labels[index] ?? '',
        });
      }
      onChange?.(event);
    },
    [items, labels, onChange, pickerGroup, pickerName]
  );

  const handleValueChanging = useCallback(
    (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
      const { index } = event.nativeEvent;
      const value = labels[index] ?? event.nativeEvent.value;
      if (pickerGroup && pickerName) {
        pickerGroup._notifyChanging(pickerName, {
          pickerName,
          index,
          value,
          item: items[index] ?? labels[index] ?? '',
        });
      }
      if (onValueChanging != null) {
        onValueChanging({
          ...event,
          nativeEvent: { index, value },
        });
      }
    },
    [items, labels, onValueChanging, pickerGroup, pickerName]
  );

  const shouldEmitValueChanging =
    onValueChanging != null || (pickerGroup != null && pickerName != null);

  return (
    <DrumPickerNative
      ref={nativeRef}
      {...(testID != null ? { testID } : {})}
      collapsable={false}
      items={labels}
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
      onValueChangingEnabled={shouldEmitValueChanging}
      onValueChanging={
        shouldEmitValueChanging ? handleValueChanging : undefined
      }
      onValueChange={handleValueChange}
      style={pickerStyle}
    />
  );
});

type DrumPickerComponent = <T = string>(
  props: DrumPickerProps<T> & RefAttributes<DrumPickerRef>
) => ReactElement | null;

const DrumPickerImpl = forwardRef<DrumPickerRef, DrumPickerProps<any>>(
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
      pickerGroup,
      pickerName,
      renderItem,
      style,
      testID,
    },
    ref
  ) {
    if (renderItem != null) {
      return (
        <DrumPickerWithRenderItem
          ref={ref}
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
          onValueChanging={onValueChanging}
          onChange={onChange}
          pickerGroup={pickerGroup}
          pickerName={pickerName}
          style={style}
          testID={testID}
          renderItem={renderItem}
        />
      );
    }

    return (
      <DrumPickerNativeBase
        ref={ref}
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
        onValueChanging={onValueChanging}
        onChange={onChange}
        pickerGroup={pickerGroup}
        pickerName={pickerName}
        style={style}
        testID={testID}
      />
    );
  }
);

DrumPickerImpl.displayName = 'DrumPicker';
export const DrumPicker = DrumPickerImpl as DrumPickerComponent;
