import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

/**
 * A labeled picker item — the wheel renders `label`, and the resolved
 * `value` is surfaced back on `onChange.nativeEvent.item`.
 *
 * Use this shape when you want the picker to display human-readable text
 * but receive a typed identifier (id, enum value, etc.) on selection,
 * without maintaining a parallel lookup array.
 */
export type DrumPickerLabeledItem<T = string> = {
  readonly label: string;
  readonly value: T;
};

/** A picker item — either a plain string or a `{ label, value }` pair. */
export type DrumPickerItem<T = string> = string | DrumPickerLabeledItem<T>;

export type DrumPickerChangeEvent<T = string> = {
  index: number;
  /** The label shown for the selected row. */
  value: string;
  /**
   * The resolved item value at `index`. When labeled items are supplied,
   * this is the `value` field; for plain string items, this equals `value`
   * (so reading `item` is always safe).
   */
  item: T;
};

export type DrumPickerProps<T = string> = {
  items: ReadonlyArray<DrumPickerItem<T>>;
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
  onChange?: (event: NativeSyntheticEvent<DrumPickerChangeEvent<T>>) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Internal helper: extract the label for a picker item. Exported because the
 * Date/Time wrappers also need to normalize items before passing them down.
 */
export function getItemLabel<T>(item: DrumPickerItem<T>): string {
  return typeof item === 'string' ? item : item.label;
}

/**
 * Internal helper: extract the resolved value for a picker item. For plain
 * strings this returns the string itself (typed as `T` since the consumer
 * chose `T = string` in that case).
 */
export function getItemValue<T>(item: DrumPickerItem<T>): T {
  return (typeof item === 'string' ? item : item.value) as T;
}
