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
   * Debounce (ms) before recentering the native item slice when the user
   * reaches the first/last row of the current window. Coalesces fast flings.
   */
  windowRecenterDebounceMs?: number;
}

type ItemWindow = { start: number; end: number };

const SLICE_UNLOCK_DELAY_MS = 48;

/**
 * Convert a global item index into a clamped local index relative to a window slice.
 *
 * @param realIndex - The index in the full items array.
 * @param windowStart - The start index of the current window (slice) within the full array.
 * @param sliceLength - The number of items in the current slice.
 * @returns The local index corresponding to `realIndex` within the slice, clamped to the range `[0, sliceLength - 1]`. Returns `0` when `sliceLength` is `0` or negative.
 */
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

/**
 * Determine whether a local index is exactly the first or last row of the slice.
 *
 * @param localIndex - Index relative to the current sliced window
 * @param sliceLength - Number of items in the current slice
 * @returns `true` if `localIndex` equals `0` or `sliceLength - 1`; `false` otherwise (also `false` when `sliceLength` is less than or equal to 1)
 */
function isAtSliceEdge(localIndex: number, sliceLength: number): boolean {
  if (sliceLength <= 1) {
    return false;
  }
  return localIndex === 0 || localIndex === sliceLength - 1;
}

/**
 * Map a native picker local index and item label to the corresponding index in the full `items` array.
 *
 * Resolves the "real" index for a native-picked row by computing an offset from `window.start` and then
 * validating or reconciling that offset against `label`. If the computed offset is out of bounds it is
 * clamped into the valid range.
 *
 * @param localIndex - The index inside the currently rendered slice (native picker index)
 * @param window - The current window slice `{ start, end }` describing the half-open range into `items`
 * @param label - The native-picked item label used to verify or correct the computed offset
 * @param items - The full list of item labels
 * @returns The index in `items` that best corresponds to the provided `localIndex` and `label`. If the
 * computed offset is out of bounds it is clamped to `[0, items.length - 1]`. If `label` matches the item
 * at the offset the offset is returned; otherwise a full-array scan is used to locate `label` and that
 * found index is returned when it lies within the current window or is within one position of the offset;
 * otherwise the original offset is returned.
 */
function resolveRealIndex(
  localIndex: number,
  window: ItemWindow,
  label: string,
  items: ReadonlyArray<string>
): number {
  const fromOffset = window.start + localIndex;
  if (fromOffset < 0 || fromOffset >= items.length) {
    return Math.min(Math.max(fromOffset, 0), Math.max(items.length - 1, 0));
  }

  const atOffset = items[fromOffset];
  if (label.length === 0 || atOffset === label) {
    return fromOffset;
  }

  const fromLabel = items.indexOf(label);
  if (fromLabel < 0) {
    return fromOffset;
  }
  if (fromLabel >= window.start && fromLabel < window.end) {
    return fromLabel;
  }
  if (Math.abs(fromLabel - fromOffset) <= 1) {
    return fromLabel;
  }
  return fromOffset;
}

/**
 * Schedules clearing of the slice-update lock after a short delay and two animation frames.
 *
 * Clears any existing unlock timeout, sets a new timeout for `SLICE_UNLOCK_DELAY_MS`, and when
 * it fires clears the timer ref and uses two nested `requestAnimationFrame` callbacks to set
 * `isUpdatingSlice.current = false`.
 *
 * @param isUpdatingSlice - Mutable ref whose `current` flag prevents reacting to picker events while the slice updates; it will be set to `false` after the delay and frames.
 * @param unlockTimer - Mutable ref used to store and clear the scheduled timeout; this function updates `unlockTimer.current`.
 */
function scheduleSliceUnlock(
  isUpdatingSlice: { current: boolean },
  unlockTimer: { current: ReturnType<typeof setTimeout> | null }
): void {
  if (unlockTimer.current != null) {
    clearTimeout(unlockTimer.current);
  }
  unlockTimer.current = setTimeout(() => {
    unlockTimer.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isUpdatingSlice.current = false;
      });
    });
  }, SLICE_UNLOCK_DELAY_MS);
}

/**
 * Clears a pending recenter timeout if present and nulls the timer ref.
 *
 * @param recenterTimer - Ref object whose `current` holds a timeout id or `null`
 */
function clearRecenterTimer(recenterTimer: {
  current: ReturnType<typeof setTimeout> | null;
}): void {
  if (recenterTimer.current != null) {
    clearTimeout(recenterTimer.current);
    recenterTimer.current = null;
  }
}

/**
 * Wraps a DrumPicker-compatible component to render only a windowed slice of a large items array.
 *
 * Item labels must be unique because recovered real indices rely on string equality.
 *
 * @param WrappedPicker - A DrumPicker-compatible component to virtualize.
 * @returns A component that accepts DrumPickerProps & VirtualizedProps and renders a windowed slice of `items`, mapping native picker indices/values to their corresponding real indices/values in the full list.
 */
export function withVirtualized(WrappedPicker: ComponentType<DrumPickerProps>) {
  const VirtualizedPicker = ({
    items,
    selectedIndex = 0,
    onChange,
    windowSize = 20,
    windowRecenterDebounceMs = 100,
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
    const isUpdatingSliceRef = useRef(false);
    const recenterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const windowRef = useRef<ItemWindow>(computeWindow(selectedIndex));

    const [window, setWindow] = useState<ItemWindow>(() =>
      computeWindow(selectedIndex)
    );
    const [anchorIndex, setAnchorIndex] = useState(selectedIndex);

    windowRef.current = window;

    useEffect(() => {
      const recenterTimer = recenterTimerRef;
      const unlockTimer = unlockTimerRef;
      return () => {
        if (recenterTimer.current != null) {
          clearTimeout(recenterTimer.current);
        }
        if (unlockTimer.current != null) {
          clearTimeout(unlockTimer.current);
        }
      };
    }, []);

    const applyWindowRecenter = useCallback(
      (realIdx: number) => {
        const newWindow = computeWindow(realIdx);
        const current = windowRef.current;
        if (
          newWindow.start === current.start &&
          newWindow.end === current.end
        ) {
          return;
        }

        isUpdatingSliceRef.current = true;
        clearRecenterTimer(recenterTimerRef);

        setAnchorIndex(realIdx);
        parentIndexRef.current = realIdx;
        windowRef.current = newWindow;
        setWindow(newWindow);

        scheduleSliceUnlock(isUpdatingSliceRef, unlockTimerRef);
      },
      [computeWindow]
    );

    const scheduleWindowRecenter = useCallback(() => {
      clearRecenterTimer(recenterTimerRef);
      recenterTimerRef.current = setTimeout(() => {
        recenterTimerRef.current = null;
        if (isUpdatingSliceRef.current) {
          return;
        }
        applyWindowRecenter(parentIndexRef.current);
      }, windowRecenterDebounceMs);
    }, [windowRecenterDebounceMs, applyWindowRecenter]);

    // Controlled updates from parent only (not echo from our own onChange).
    useEffect(() => {
      if (selectedIndex === parentIndexRef.current) {
        return;
      }
      clearRecenterTimer(recenterTimerRef);
      parentIndexRef.current = selectedIndex;
      isUpdatingSliceRef.current = true;
      setAnchorIndex(selectedIndex);
      const nextWindow = computeWindow(selectedIndex);
      windowRef.current = nextWindow;
      setWindow(nextWindow);
      scheduleSliceUnlock(isUpdatingSliceRef, unlockTimerRef);
    }, [selectedIndex, computeWindow]);

    // Keep anchor/window valid when the list shrinks or is cleared.
    useEffect(() => {
      clearRecenterTimer(recenterTimerRef);

      if (totalCount === 0) {
        if (windowRef.current.start === 0 && windowRef.current.end === 0) {
          parentIndexRef.current = 0;
          return;
        }
        parentIndexRef.current = 0;
        isUpdatingSliceRef.current = true;
        setAnchorIndex(0);
        const emptyWindow: ItemWindow = { start: 0, end: 0 };
        windowRef.current = emptyWindow;
        setWindow(emptyWindow);
        scheduleSliceUnlock(isUpdatingSliceRef, unlockTimerRef);
        return;
      }

      const maxIndex = totalCount - 1;
      const targetIdx = Math.min(Math.max(parentIndexRef.current, 0), maxIndex);
      const newWindow = computeWindow(targetIdx);
      const current = windowRef.current;
      if (
        targetIdx === parentIndexRef.current &&
        newWindow.start === current.start &&
        newWindow.end === current.end &&
        current.end <= totalCount
      ) {
        return;
      }

      parentIndexRef.current = targetIdx;
      isUpdatingSliceRef.current = true;
      setAnchorIndex(targetIdx);
      windowRef.current = newWindow;
      setWindow(newWindow);
      scheduleSliceUnlock(isUpdatingSliceRef, unlockTimerRef);
    }, [totalCount, computeWindow]);

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
        if (isUpdatingSliceRef.current) {
          return;
        }

        const localIdx = event.nativeEvent.index;
        const currentWindow = windowRef.current;
        const realIdx = resolveRealIndex(
          localIdx,
          currentWindow,
          event.nativeEvent.value,
          items
        );

        setAnchorIndex(realIdx);
        parentIndexRef.current = realIdx;

        const sliceLength = currentWindow.end - currentWindow.start;
        if (isAtSliceEdge(localIdx, sliceLength)) {
          scheduleWindowRecenter();
        } else {
          clearRecenterTimer(recenterTimerRef);
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
      [items, onChange, scheduleWindowRecenter]
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
