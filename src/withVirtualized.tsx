import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import type { DrumPickerChangeEvent, DrumPickerProps } from './types';

export interface VirtualizedProps {
  /**
   * Number of items to render above and below the visible window.
   * Default: 20. Increase for faster flings.
   */
  windowSize?: number;
  /**
   * When the selection is within this many rows of the sliced window edge,
   * the window recenters on the current index. Avoids shifting the native
   * item list on every scroll tick (which caused phantom rows / index gaps).
   */
  windowEdgeThreshold?: number;
}

type ItemWindow = { start: number; end: number };

function clampLocalIndex(
  realIndex: number,
  windowStart: number,
  sliceLength: number
): number {
  if (sliceLength <= 0) {
    return 0;
  }
  const local = realIndex - windowStart;
  return Math.min(Math.max(local, 0), sliceLength - 1);
}

function shouldRecenterWindow(
  localIndex: number,
  sliceLength: number,
  edgeThreshold: number
): boolean {
  if (sliceLength <= 1) {
    return false;
  }
  const margin = Math.min(edgeThreshold, Math.floor((sliceLength - 1) / 2));
  return localIndex <= margin || localIndex >= sliceLength - 1 - margin;
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
    windowEdgeThreshold = 5,
    ...rest
  }: DrumPickerProps & VirtualizedProps) => {
    const totalCount = items.length;

    const computeWindow = useCallback(
      (centerIndex: number): ItemWindow => {
        const start = Math.max(0, centerIndex - windowSize);
        const end = Math.min(totalCount, centerIndex + windowSize + 1);
        return { start, end };
      },
      [totalCount, windowSize]
    );

    const parentIndexRef = useRef(selectedIndex);
    const [window, setWindow] = useState<ItemWindow>(() =>
      computeWindow(selectedIndex)
    );
    /** Authoritative real index for native mapping — updated immediately on scroll. */
    const [anchorIndex, setAnchorIndex] = useState(selectedIndex);

    // Controlled updates from parent only (not echo from our own onChange).
    useEffect(() => {
      if (selectedIndex === parentIndexRef.current) {
        return;
      }
      parentIndexRef.current = selectedIndex;
      setAnchorIndex(selectedIndex);
      setWindow(computeWindow(selectedIndex));
    }, [selectedIndex, computeWindow]);

    const slicedItems = useMemo(
      () => items.slice(window.start, window.end),
      [items, window.start, window.end]
    );

    const localIndex = useMemo(
      () => clampLocalIndex(anchorIndex, window.start, slicedItems.length),
      [anchorIndex, window.start, slicedItems.length]
    );

    const handleChange = useCallback(
      (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        const localIdx = event.nativeEvent.index;
        const realIdx = window.start + localIdx;

        setAnchorIndex(realIdx);
        parentIndexRef.current = realIdx;

        if (
          shouldRecenterWindow(
            localIdx,
            slicedItems.length,
            windowEdgeThreshold
          )
        ) {
          const newWindow = computeWindow(realIdx);
          if (
            newWindow.start !== window.start ||
            newWindow.end !== window.end
          ) {
            setWindow(newWindow);
          }
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
      [
        window,
        items,
        onChange,
        computeWindow,
        slicedItems.length,
        windowEdgeThreshold,
      ]
    );

    return (
      <WrappedPicker
        key={`virtualized-${window.start}-${window.end}`}
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
