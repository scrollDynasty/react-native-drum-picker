import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { DRUM_PICKER_DEFAULTS as DEFAULTS } from './drumPickerDefaults';
import { getItemLabel, getItemValue, type DrumPickerProps } from './types';

/**
 * Structural type for the subset of the DOM change event we need. The project
 * tsconfig intentionally excludes the DOM `lib`, so we describe what we read
 * locally rather than depend on `HTMLSelectElement` types.
 */
type WebSelectChangeEvent = {
  target: { selectedIndex: number };
  currentTarget?: unknown;
  bubbles?: boolean;
  cancelable?: boolean;
  defaultPrevented?: boolean;
  eventPhase?: number;
  isTrusted?: boolean;
  timeStamp?: number;
  preventDefault: () => void;
  stopPropagation: () => void;
};

/**
 * Web fallback for `DrumPicker`.
 *
 * Native `DrumPicker` is a Fabric view that only exists on iOS and Android.
 * On web (Expo Web / `react-native-web` / SSR), we render a real HTML
 * `<select>` element so that:
 *
 * - SSR / `react-native-web` builds don't crash at module load
 * - The picker is keyboard-navigable and screen-reader-friendly by default
 * - The same `value` and `onChange` contract works cross-platform — callers
 *   read `event.nativeEvent.index`, `value`, and `item` the same way
 *
 * Labeled `{ label, value }` items are supported here too: the wheel renders
 * `label`, and `onChange` reports the resolved `value` on `nativeEvent.item`.
 *
 * A drum-style scroll wheel on web is a separate, larger feature; this
 * fallback gives the lib a useful baseline web experience today.
 */
export function DrumPicker<T = string>({
  items,
  selectedIndex = DEFAULTS.selectedIndex,
  itemHeight = DEFAULTS.itemHeight,
  visibleItemCount = DEFAULTS.visibleItemCount,
  textColor = DEFAULTS.textColor,
  selectedTextColor = DEFAULTS.selectedTextColor,
  textSize = DEFAULTS.textSize,
  backgroundColor = DEFAULTS.backgroundColor,
  accessibilityLabel = DEFAULTS.accessibilityLabel,
  onChange,
  style,
  testID,
}: DrumPickerProps<T>) {
  const safeIndex = Math.min(
    Math.max(selectedIndex, 0),
    Math.max(items.length - 1, 0)
  );

  // Mirror native's "don't re-emit identical index" contract so React state
  // bouncing back into the controlled value doesn't loop.
  const lastEmittedIndexRef = useRef(safeIndex);
  useEffect(() => {
    lastEmittedIndexRef.current = safeIndex;
  }, [safeIndex]);

  const flatStyle = useMemo(
    () =>
      (StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {}) as ViewStyle,
    [style]
  );

  const inlineStyle = useMemo<CSSProperties>(() => {
    const heightFromStyle =
      typeof flatStyle.height === 'number' ? flatStyle.height : undefined;
    const widthFromStyle =
      typeof flatStyle.width === 'number' ? flatStyle.width : undefined;
    return {
      width: widthFromStyle ?? '100%',
      height: heightFromStyle ?? itemHeight * Math.max(visibleItemCount, 1),
      color: selectedTextColor,
      background: backgroundColor,
      fontSize: textSize,
      border: 'none',
      outline: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      appearance: 'none',
      textAlign: 'center',
      textAlignLast: 'center',
    };
  }, [
    backgroundColor,
    flatStyle.height,
    flatStyle.width,
    itemHeight,
    selectedTextColor,
    textSize,
    visibleItemCount,
  ]);

  const optionStyle = useMemo<CSSProperties>(
    () => ({
      color: textColor,
      background: backgroundColor,
    }),
    [backgroundColor, textColor]
  );

  const handleChange = useCallback(
    (event: WebSelectChangeEvent) => {
      const index = event.target.selectedIndex;
      if (index === lastEmittedIndexRef.current) {
        return;
      }
      lastEmittedIndexRef.current = index;
      if (!onChange) {
        return;
      }
      const source = items[index];
      const label =
        source !== undefined ? getItemLabel(source) : '';
      const item: T =
        source !== undefined
          ? getItemValue<T>(source)
          : (label as unknown as T);
      // Synthesize a payload shaped like the native event so calling code
      // does not need to branch on platform.
      const synthetic = {
        nativeEvent: { index, value: label, item },
        target: event.target,
        currentTarget: event.currentTarget,
        bubbles: event.bubbles,
        cancelable: event.cancelable,
        defaultPrevented: event.defaultPrevented,
        eventPhase: event.eventPhase,
        isTrusted: event.isTrusted,
        timeStamp: event.timeStamp,
        type: 'change',
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
        isDefaultPrevented: () => event.defaultPrevented,
        isPropagationStopped: () => false,
        persist: () => {},
      };
      onChange(
        synthetic as unknown as Parameters<NonNullable<typeof onChange>>[0]
      );
    },
    [items, onChange]
  );

  // Use createElement so we don't depend on react-native-web's createElement
  // override and we keep this file framework-light.
  return createElement(
    'select',
    {
      'value': safeIndex,
      'onChange': handleChange,
      'style': inlineStyle,
      'data-testid': testID,
      'aria-label': accessibilityLabel,
      'size': Math.max(visibleItemCount, 1),
    },
    items.map((item, index) =>
      createElement(
        'option',
        { key: index, value: index, style: optionStyle },
        getItemLabel(item)
      )
    )
  );
}
