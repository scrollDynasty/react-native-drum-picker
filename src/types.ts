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

/**
 * A picker item.
 *
 * - When `T` is `string` (the default), an item may be either a plain string
 *   or a `{ label, value }` pair.
 * - When `T` is a non-string type, items **must** be `{ label, value }` pairs
 *   so the resolved `value` on `onChange.nativeEvent.item` is genuinely `T`.
 *
 * The `[T] extends [string]` wrapping keeps the check non-distributive so
 * union value types behave predictably.
 */
export type DrumPickerItem<T = string> = [T] extends [string]
  ? string | DrumPickerLabeledItem<T>
  : DrumPickerLabeledItem<T>;

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
  /**
   * Accessibility label for the whole picker. Forwarded to the native view's
   * `accessibilityLabel` and, on web, to the `<select>` element's
   * `aria-label`. Defaults to `'Picker'` on web when omitted.
   */
  accessibilityLabel?: string;
  onChange?: (event: NativeSyntheticEvent<DrumPickerChangeEvent<T>>) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Internal helper: extract the label string for a picker item. Exported so
 * the native wrapper (`DrumPicker.native.tsx`) and the web fallback
 * (`DrumPicker.tsx`) share one normalization path before handing items to the
 * platform layer.
 */
export function getItemLabel<T>(
  item: string | DrumPickerLabeledItem<T>
): string {
  return typeof item === 'string' ? item : item.label;
}

/**
 * Internal helper: extract the resolved value for a picker item. For plain
 * strings this returns the string itself (typed as `T` since plain-string
 * items are only allowed when `T = string`).
 */
export function getItemValue<T>(item: string | DrumPickerLabeledItem<T>): T {
  return (typeof item === 'string' ? item : item.value) as T;
}
