import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import type { DrumPickerChangeEvent, DrumPickerProps } from './types';

export interface VirtualizedProps {
  /**
   * Number of items to render above and below the visible window.
   * Default: 20. Increase for faster flings.
   */
  windowSize?: number;
}

/**
 * HOC that virtualizes a DrumPicker for large item lists.
 * Only renders items near the current selection, keeping native
 * RecyclerView / UIPickerView lean even with 10,000+ items.
 */
export function withVirtualized(WrappedPicker: ComponentType<DrumPickerProps>) {
  const VirtualizedPicker = ({
    items,
    selectedIndex = 0,
    onChange,
    windowSize = 20,
    ...rest
  }: DrumPickerProps & VirtualizedProps) => {
    const totalCount = items.length;

    const computeWindow = useCallback(
      (centerIndex: number) => {
        const start = Math.max(0, centerIndex - windowSize);
        const end = Math.min(totalCount, centerIndex + windowSize + 1);
        return { start, end };
      },
      [totalCount, windowSize]
    );

    const [window, setWindow] = useState(() => computeWindow(selectedIndex));
    const realIndexRef = useRef(selectedIndex);

    useEffect(() => {
      realIndexRef.current = selectedIndex;
      setWindow(computeWindow(selectedIndex));
    }, [selectedIndex, computeWindow]);

    const slicedItems = items.slice(window.start, window.end);

    const localIndex = Math.min(
      Math.max(selectedIndex - window.start, 0),
      Math.max(slicedItems.length - 1, 0)
    );

    const handleChange = useCallback(
      (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        const localIdx = event.nativeEvent.index;
        const realIdx = window.start + localIdx;
        realIndexRef.current = realIdx;

        const newWindow = computeWindow(realIdx);
        if (newWindow.start !== window.start || newWindow.end !== window.end) {
          setWindow(newWindow);
        }

        onChange?.({
          ...event,
          nativeEvent: {
            ...event.nativeEvent,
            index: realIdx,
            value: items[realIdx] ?? event.nativeEvent.value,
          },
        });
      },
      [window, items, onChange, computeWindow]
    );

    return (
      <WrappedPicker
        {...rest}
        items={slicedItems}
        selectedIndex={localIndex}
        onChange={handleChange}
      />
    );
  };

  VirtualizedPicker.displayName = `withVirtualized(${
    WrappedPicker.displayName ?? WrappedPicker.name ?? 'DrumPicker'
  })`;

  return VirtualizedPicker;
}
