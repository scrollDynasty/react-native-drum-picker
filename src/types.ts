import type { ReactNode } from 'react';
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

export type DrumPickerChangeEvent = {
  index: number;
  value: string;
};

/**
 * Imperative handle exposed via ref on DrumPicker.
 *
 * @example
 * const ref = useRef<DrumPickerRef>(null);
 * ref.current?.scrollToIndex(3, { animated: true });
 * ref.current?.scrollToValue('March');
 */
export interface DrumPickerRef {
  /**
   * Scroll to a specific index. Clamped to valid range — never throws on out-of-bounds.
   * `options.animated` defaults to `true`. Fires `onChange` when the index changes.
   */
  scrollToIndex(index: number, options?: { animated?: boolean }): void;

  /**
   * Scroll to the first item matching the value string.
   * No-op if value not found in items.
   * @param options.animated Defaults to `true`.
   */
  scrollToValue(value: string, options?: { animated?: boolean }): void;

  /** Returns the currently selected index. */
  getCurrentIndex(): number;

  /** Returns the currently selected value string. */
  getCurrentValue(): string;
}

export interface DateConstraint {
  day?: number;
  month?: number;
  year?: number;
}

export interface DateDrumPickerRef {
  /**
   * Scroll visible columns to the given date. Omitted fields leave those columns unchanged.
   * Clamps invalid days (e.g. day 31 → February) and calls `onChange` when provided.
   */
  scrollToDate(
    date: { day?: number; month?: number; year?: number },
    options?: { animated?: boolean }
  ): void;

  /** Returns the current selection as day / month / year. */
  getCurrentDate(): { day: number; month: number; year: number };
}

export interface DrumPickerRenderItemInfo<T = string> {
  /** The item value */
  item: T;
  /** Display label string */
  label: string;
  /** Index in the items array */
  index: number;
  /** Whether this item is currently centered / selected */
  isSelected: boolean;
}

// Event from a single picker within a group
export interface PickerGroupEvent<T = string> {
  /** Which picker fired */
  pickerName: string;
  /** The new selected index */
  index: number;
  /** The new selected value string */
  value: string;
  /** The raw item */
  item: T;
}

// Map of pickerName -> current state
export interface PickerGroupState {
  [pickerName: string]: {
    index: number;
    value: string;
  };
}

// The group object returned by usePickerGroup
export interface PickerGroupHandle {
  /** @internal - used by DrumPicker, do not call directly */
  _register(
    name: string,
    handlers: {
      onChanged: (e: PickerGroupEvent) => void;
      onChanging: (e: PickerGroupEvent) => void;
    }
  ): () => void;

  /** @internal */
  _notifyChanged(name: string, event: PickerGroupEvent): void;

  /** @internal */
  _notifyChanging(name: string, event: PickerGroupEvent): void;

  /**
   * Get current state snapshot of all pickers in the group.
   */
  getState(): PickerGroupState;
}

export type DrumPickerProps<T = string> = {
  items: T[];
  selectedIndex?: number;
  /**
   * Enable circular (infinite loop) scrolling.
   * When user scrolls past the last item, wraps to first.
   * When user scrolls before the first item, wraps to last.
   *
   * Best for: hours (0-23), minutes (0-59), days of week,
   * months, compass directions.
   *
   * Not recommended for: long lists (cities, countries),
   * lists where first/last item has clear meaning (years).
   *
   * @default false
   *
   * @example
   * <DrumPicker circular items={minutes} />
   */
  circular?: boolean;
  itemHeight?: number;
  visibleItemCount?: number;
  textColor?: string;
  selectedTextColor?: string;
  textSize?: number;
  selectedTextSize?: number;
  showSelectionIndicator?: boolean;
  selectionIndicatorColor?: string;
  selectionIndicatorHeight?: number;
  backgroundColor?: string;
  itemBackgroundColor?: string;
  containerBackgroundColor?: string;
  hapticFeedback?: boolean;
  /**
   * Block user interaction. The wheel stops responding to drags and taps,
   * and swallows touches instead of passing them to views underneath.
   *
   * Scrolling driven from your own code is unaffected: `selectedIndex`
   * updates and the `scrollToIndex` / `scrollToValue` ref methods still work,
   * which is what you usually want while a form is submitting.
   *
   * Appearance is left to you — combine with `textColor` or a wrapping
   * `<View style={{ opacity: 0.4 }}>` if the picker should also look inert.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When true, tapping an item above or below the center
   * scrolls the picker to that item.
   * @default false
   */
  enableScrollByTapOnItem?: boolean;
  /**
   * Fires on every scroll tick while the user is dragging.
   * Called before the picker settles — use for live sync
   * between multiple pickers (e.g. hours + minutes).
   *
   * Note: may fire many times per second. Keep the handler fast.
   * Do NOT setState in render-blocking ways here.
   */
  onValueChanging?: (
    event: NativeSyntheticEvent<DrumPickerChangeEvent>
  ) => void;
  onChange?: (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => void;
  /**
   * Attach this picker to a PickerGroup created with usePickerGroup().
   * Use pickerName to identify this picker within the group.
   */
  pickerGroup?: PickerGroupHandle;
  /**
   * Unique name for this picker within its group.
   * Required when pickerGroup is provided.
   */
  pickerName?: string;
  /**
   * Custom renderer for each picker item.
   * Native scroll physics and snap behavior stay unchanged.
   */
  renderItem?: (info: DrumPickerRenderItemInfo<T>) => ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
