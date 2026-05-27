import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
} from 'react-native';
import { resolveDrumPickerStyle } from './drumPickerLayout';
import type {
  DrumPickerChangeEvent,
  DrumPickerProps,
  DrumPickerRef,
} from './types';

let didWarnWebStub = false;

function clampIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, itemCount - 1));
}

/**
 * Web / non-native fallback: read-only preview + working ref API (no native wheel).
 * Metro resolves `DrumPicker.native.tsx` on iOS and Android.
 */
export const DrumPicker = forwardRef<DrumPickerRef, DrumPickerProps>(
  function DrumPicker(
    {
      items,
      selectedIndex = 0,
      itemHeight = 44,
      visibleItemCount = 5,
      textColor = '#8E8E93',
      selectedTextColor = '#1C1C1E',
      textSize = 20,
      onChange,
      style,
      testID,
    },
    ref
  ) {
    const [index, setIndex] = useState(() =>
      clampIndex(selectedIndex, items.length)
    );
    const indexRef = useRef(index);
    const lastEmittedRef = useRef(index);

    useEffect(() => {
      const clamped = clampIndex(selectedIndex, items.length);
      indexRef.current = clamped;
      lastEmittedRef.current = clamped;
      setIndex(clamped);
    }, [selectedIndex, items.length]);

    useEffect(() => {
      if (__DEV__ && !didWarnWebStub) {
        didWarnWebStub = true;
        console.warn(
          'react-native-drum-picker: DrumPicker renders a read-only web preview. ' +
            'Use iOS or Android for the native wheel.'
        );
      }
    }, []);

    const applyScroll = useCallback(
      (nextIndex: number) => {
        const clamped = clampIndex(nextIndex, items.length);
        const previous = lastEmittedRef.current;
        indexRef.current = clamped;
        lastEmittedRef.current = clamped;
        setIndex(clamped);
        if (onChange != null && clamped !== previous) {
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
        scrollToIndex(nextIndex, _options = {}) {
          applyScroll(nextIndex);
        },
        scrollToValue(value, _options = {}) {
          const match = items.indexOf(value);
          if (match !== -1) {
            applyScroll(match);
          }
        },
        getCurrentIndex() {
          return indexRef.current;
        },
        getCurrentValue() {
          return items[indexRef.current] ?? '';
        },
      }),
      [applyScroll, items]
    );

    const pickerStyle = resolveDrumPickerStyle(
      itemHeight,
      visibleItemCount,
      style
    );
    const value = items[index] ?? '';

    return (
      <View
        testID={testID}
        accessibilityRole="adjustable"
        accessibilityLabel={value}
        style={[pickerStyle, styles.container]}
      >
        <Text style={{ fontSize: textSize, color: selectedTextColor }}>
          {value}
        </Text>
        {__DEV__ ? (
          <Text style={[styles.hint, { color: textColor }]}>Web preview</Text>
        ) : null}
      </View>
    );
  }
);

DrumPicker.displayName = 'DrumPicker';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  hint: {
    fontSize: 10,
    marginTop: 4,
  },
});
