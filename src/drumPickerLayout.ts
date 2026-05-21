import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

let didWarnMissingLayout = false;

/**
 * Merges consumer style with sensible defaults so the native picker is visible
 * without forcing dimensions when flex layout is used.
 */
export function resolveDrumPickerStyle(
  itemHeight: number,
  visibleItemCount: number,
  style?: StyleProp<ViewStyle>
): ViewStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const pickerHeight = itemHeight * visibleItemCount;
  const hasExplicitHeight =
    flat.height != null || flat.minHeight != null || flat.maxHeight != null;
  const usesFlex =
    flat.flex != null ||
    flat.flexGrow != null ||
    flat.flexShrink != null ||
    flat.alignSelf === 'stretch';

  if (__DEV__ && !didWarnMissingLayout && !hasExplicitHeight && !usesFlex) {
    didWarnMissingLayout = true;
    console.warn(
      'react-native-drum-picker: DrumPicker needs a visible height. ' +
        `Defaulting to itemHeight * visibleItemCount (${pickerHeight}). ` +
        'Pass style={{ height: ... }} or style={{ minHeight: ... }} for precise control.'
    );
  }

  const sizeDefaults: ViewStyle =
    hasExplicitHeight || usesFlex
      ? { minWidth: 64, minHeight: pickerHeight }
      : { minWidth: 64, minHeight: pickerHeight, height: pickerHeight };

  return StyleSheet.flatten([sizeDefaults, style]) as ViewStyle;
}
