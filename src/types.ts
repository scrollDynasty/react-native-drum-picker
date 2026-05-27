import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

export type DrumPickerChangeEvent = {
  index: number;
  value: string;
};

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
