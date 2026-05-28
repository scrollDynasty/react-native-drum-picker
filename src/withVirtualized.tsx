import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import type {
  DrumPickerChangeEvent,
  DrumPickerProps,
  DrumPickerRef,
  DrumPickerRenderItemInfo,
} from './types';
import { getItemLabel } from './itemLabel';

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

function clampRealIndex(realIndex: number, totalCount: number): number {
  if (totalCount <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(realIndex, totalCount - 1));
}

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

/** Recenter only on the actual first/last row — not a wide margin band. */
function isAtSliceEdge(localIndex: number, sliceLength: number): boolean {
  if (sliceLength <= 1) {
    return false;
  }
  return localIndex === 0 || localIndex === sliceLength - 1;
}

/**
 * Map native index + label to a real index. Uses O(1) offset math when the
 * label matches; scans the full array only on mismatch (slice swap glitches).
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

function clearRecenterTimer(recenterTimer: {
  current: ReturnType<typeof setTimeout> | null;
}): void {
  if (recenterTimer.current != null) {
    clearTimeout(recenterTimer.current);
    recenterTimer.current = null;
  }
}

/**
 * HOC that virtualizes a DrumPicker for large item lists.
 * Only renders items near the current selection, keeping native
 * RecyclerView / UIPickerView lean even with 10,000+ items.
 *
 * Item labels must be unique — index recovery uses string equality.
 * Forwards `DrumPickerRef` (scrollToIndex / scrollToValue use real indices).
 */
export function withVirtualized(
  WrappedPicker: ForwardRefExoticComponent<
    DrumPickerProps & RefAttributes<DrumPickerRef>
  >
) {
  const VirtualizedPicker = forwardRef<
    DrumPickerRef,
    DrumPickerProps & VirtualizedProps
  >(function VirtualizedPicker(
    {
      items,
      selectedIndex = 0,
      onChange,
      onValueChanging,
      renderItem,
      circular,
      windowSize = 20,
      windowRecenterDebounceMs = 100,
      ...rest
    },
    ref
  ) {
    const totalCount = items.length;
    const innerRef = useRef<DrumPickerRef>(null);
    const pendingImperativeScrollRef = useRef<{
      localIndex: number;
      animated: boolean;
    } | null>(null);

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

    useEffect(() => {
      if (__DEV__ && circular === true && items.length > 100) {
        console.warn(
          '[withVirtualized] circular=true with large lists: ' +
            'the multiplied array (items × 200) may be large. ' +
            'Consider using circular without withVirtualized ' +
            'for lists > 100 items.'
        );
      }
    }, [circular, items.length]);

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

    const scrollToRealIndex = useCallback(
      (realIndex: number, animated: boolean) => {
        const clamped = clampRealIndex(realIndex, totalCount);
        const previousEmitted = parentIndexRef.current;
        clearRecenterTimer(recenterTimerRef);
        parentIndexRef.current = clamped;
        isUpdatingSliceRef.current = true;
        const newWindow = computeWindow(clamped);
        setAnchorIndex(clamped);
        windowRef.current = newWindow;
        setWindow(newWindow);
        const sliceLength = newWindow.end - newWindow.start;
        pendingImperativeScrollRef.current = {
          localIndex: clampLocalIndex(clamped, newWindow.start, sliceLength),
          animated,
        };
        scheduleSliceUnlock(isUpdatingSliceRef, unlockTimerRef);

        if (onChange != null && clamped !== previousEmitted) {
          onChange({
            nativeEvent: {
              index: clamped,
              value: items[clamped] ?? '',
            },
          } as NativeSyntheticEvent<DrumPickerChangeEvent>);
        }
      },
      [computeWindow, items, onChange, totalCount]
    );

    useEffect(() => {
      const pending = pendingImperativeScrollRef.current;
      if (pending == null) {
        return;
      }
      pendingImperativeScrollRef.current = null;
      innerRef.current?.scrollToIndex(pending.localIndex, {
        animated: pending.animated,
      });
    }, [window.start, window.end, anchorIndex]);

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

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex(index, options = {}) {
          scrollToRealIndex(index, options.animated ?? true);
        },
        scrollToValue(value, options = {}) {
          const index = items.indexOf(value);
          if (index === -1) {
            return;
          }
          scrollToRealIndex(index, options.animated ?? true);
        },
        getCurrentIndex() {
          return parentIndexRef.current;
        },
        getCurrentValue() {
          return items[parentIndexRef.current] ?? '';
        },
      }),
      [items, scrollToRealIndex]
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

    const handleValueChanging = useCallback(
      (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        if (isUpdatingSliceRef.current || onValueChanging == null) {
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

        onValueChanging({
          ...event,
          nativeEvent: {
            ...event.nativeEvent,
            index: realIdx,
            value: items[realIdx] ?? event.nativeEvent.value,
          },
        });
      },
      [items, onValueChanging]
    );

    const mappedRenderItem = useCallback(
      (info: DrumPickerRenderItemInfo<string>) => {
        if (renderItem == null) {
          return null;
        }
        const currentWindow = windowRef.current;
        const realIndex = resolveRealIndex(
          info.index,
          currentWindow,
          info.label,
          items
        );
        const realItem = items[realIndex] ?? info.item;
        return renderItem({
          item: realItem,
          label: getItemLabel(realItem),
          index: realIndex,
          isSelected: info.isSelected,
        });
      },
      [items, renderItem]
    );

    return (
      <WrappedPicker
        ref={innerRef}
        {...rest}
        circular={circular}
        items={slicedItems}
        selectedIndex={localIndex}
        onChange={handleChange}
        onValueChanging={
          onValueChanging != null ? handleValueChanging : undefined
        }
        renderItem={renderItem != null ? mappedRenderItem : undefined}
      />
    );
  });

  VirtualizedPicker.displayName = `withVirtualized(${
    WrappedPicker.displayName ?? WrappedPicker.name ?? 'DrumPicker'
  })`;

  return VirtualizedPicker;
}
