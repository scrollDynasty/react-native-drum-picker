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
  Pressable,
  Text,
  View,
  type NativeSyntheticEvent,
} from 'react-native';
import { resolveDrumPickerStyle } from './drumPickerLayout';
import { getItemLabel } from './itemLabel';
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
export const DrumPicker = forwardRef<DrumPickerRef, DrumPickerProps<any>>(
  function DrumPicker(
    {
      items,
      selectedIndex = 0,
      itemHeight = 44,
      visibleItemCount = 5,
      textColor = '#8E8E93',
      selectedTextColor = '#1C1C1E',
      textSize = 20,
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
    const labels = items.map((item) => getItemLabel(item));
    const [index, setIndex] = useState(() =>
      clampIndex(selectedIndex, labels.length)
    );
    const indexRef = useRef(index);
    const lastEmittedRef = useRef(index);

    useEffect(() => {
      const clamped = clampIndex(selectedIndex, labels.length);
      indexRef.current = clamped;
      lastEmittedRef.current = clamped;
      setIndex(clamped);
    }, [selectedIndex, labels.length]);

    useEffect(() => {
      if (__DEV__ && !didWarnWebStub) {
        didWarnWebStub = true;
        console.warn(
          'react-native-drum-picker: DrumPicker renders a read-only web preview. ' +
            'Use iOS or Android for the native wheel.'
        );
      }
    }, []);

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

    const applyScroll = useCallback(
      (nextIndex: number) => {
        const clamped = clampIndex(nextIndex, items.length);
        const previous = lastEmittedRef.current;
        indexRef.current = clamped;
        lastEmittedRef.current = clamped;
        setIndex(clamped);
        if (clamped !== previous) {
          if (pickerGroup && pickerName) {
            const groupEvent = {
              pickerName,
              index: clamped,
              value: labels[clamped] ?? '',
              item: items[clamped] ?? labels[clamped] ?? '',
            };
            pickerGroup._notifyChanging(pickerName, groupEvent);
            pickerGroup._notifyChanged(pickerName, groupEvent);
          }
        }
        if (onValueChanging != null && clamped !== previous) {
          onValueChanging({
            nativeEvent: {
              index: clamped,
              value: labels[clamped] ?? '',
            },
          } as NativeSyntheticEvent<DrumPickerChangeEvent>);
        }
        if (onChange != null && clamped !== previous) {
          onChange({
            nativeEvent: {
              index: clamped,
              value: labels[clamped] ?? '',
            },
          } as NativeSyntheticEvent<DrumPickerChangeEvent>);
        }
      },
      [items, labels, onChange, onValueChanging, pickerGroup, pickerName]
    );

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex(nextIndex, _options = {}) {
          applyScroll(nextIndex);
        },
        scrollToValue(value, _options = {}) {
          const match = labels.indexOf(value);
          if (match !== -1) {
            applyScroll(match);
          }
        },
        getCurrentIndex() {
          return indexRef.current;
        },
        getCurrentValue() {
          return labels[indexRef.current] ?? '';
        },
      }),
      [applyScroll, labels]
    );

    const pickerStyle = resolveDrumPickerStyle(
      itemHeight,
      visibleItemCount,
      style
    );
    const value = labels[index] ?? '';
    const centerOffset = Math.floor(visibleItemCount / 2);
    const visibleItems = Array.from({ length: visibleItemCount }, (_, i) => {
      const itemIndex = index - centerOffset + i;
      return {
        item: items[itemIndex],
        index: itemIndex,
        isSelected: itemIndex === index,
        position: i,
      };
    });

    if (renderItem != null) {
      return (
        <View
          testID={testID}
          accessibilityRole="adjustable"
          accessibilityLabel={value}
          style={[pickerStyle, styles.container]}
        >
          {visibleItems.map(
            ({ item, index: itemIndex, isSelected, position }) => (
              <Pressable
                key={`${itemIndex}-${position}`}
                style={[
                  styles.webRow,
                  {
                    top: position * itemHeight,
                    height: itemHeight,
                  },
                ]}
                onPress={() => applyScroll(itemIndex)}
              >
                {item != null
                  ? renderItem({
                      item,
                      label: getItemLabel(item),
                      index: itemIndex,
                      isSelected,
                    })
                  : null}
              </Pressable>
            )
          )}
        </View>
      );
    }

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
    position: 'relative',
    overflow: 'hidden',
  },
  hint: {
    fontSize: 10,
    marginTop: 4,
  },
  webRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
