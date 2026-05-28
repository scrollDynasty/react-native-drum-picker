import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import { DrumPickerNativeBase } from './DrumPicker.native';
import { resolveDrumPickerStyle } from './drumPickerLayout';
import { getItemLabel } from './itemLabel';
import type {
  DrumPickerChangeEvent,
  DrumPickerProps,
  DrumPickerRef,
  DrumPickerRenderItemInfo,
} from './types';

type Props<T> = DrumPickerProps<T> & {
  renderItem: (info: DrumPickerRenderItemInfo<T>) => ReactNode;
};

export const DrumPickerWithRenderItem = forwardRef<DrumPickerRef, Props<any>>(
  function DrumPickerWithRenderItem(
    {
      items,
      selectedIndex = 0,
      itemHeight = 44,
      visibleItemCount = 5,
      onChange,
      onValueChanging,
      renderItem,
      style,
      ...rest
    },
    ref
  ) {
    const [currentIndex, setCurrentIndex] = useState(selectedIndex);
    const [changingIndex, setChangingIndex] = useState(selectedIndex);
    const liveIndex = onValueChanging != null ? changingIndex : currentIndex;
    const pickerStyle = resolveDrumPickerStyle(
      itemHeight,
      visibleItemCount,
      style
    );
    const centerOffset = Math.floor(visibleItemCount / 2);
    const rootStyle = pickerStyle as ViewStyle;

    const handleChange = useCallback(
      (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        setCurrentIndex(event.nativeEvent.index);
        onChange?.(event);
      },
      [onChange]
    );

    const handleValueChanging = useCallback(
      (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        setChangingIndex(event.nativeEvent.index);
        onValueChanging?.(event);
      },
      [onValueChanging]
    );

    const visibleItems = useMemo(() => {
      const result: Array<{
        itemIndex: number;
        item: unknown;
        isSelected: boolean;
        position: number;
      }> = [];
      for (let i = 0; i < visibleItemCount; i += 1) {
        const itemIndex = liveIndex - centerOffset + i;
        result.push({
          itemIndex,
          item: items[itemIndex],
          isSelected: itemIndex === liveIndex,
          position: i,
        });
      }
      return result;
    }, [centerOffset, items, liveIndex, visibleItemCount]);

    return (
      <View style={rootStyle}>
        <DrumPickerNativeBase
          ref={ref}
          {...rest}
          items={items}
          selectedIndex={selectedIndex}
          itemHeight={itemHeight}
          visibleItemCount={visibleItemCount}
          onChange={handleChange}
          onValueChanging={handleValueChanging}
          style={StyleSheet.absoluteFill}
        />

        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {visibleItems.map(({ itemIndex, item, isSelected, position }) => (
            <View
              key={`${itemIndex}-${position}`}
              style={[
                styles.row,
                {
                  top: position * itemHeight,
                  height: itemHeight,
                },
              ]}
            >
              {item != null
                ? renderItem({
                    item,
                    label: getItemLabel(item),
                    index: itemIndex,
                    isSelected,
                  })
                : null}
            </View>
          ))}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
