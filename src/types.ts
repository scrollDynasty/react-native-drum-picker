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

export type DrumPickerProps = {
  items: string[];
  selectedIndex?: number;
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
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
