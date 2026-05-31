/**
 * Default prop values for `DrumPicker`, shared between the native
 * (`DrumPicker.native.tsx`) and web (`DrumPicker.tsx`) implementations so the
 * two platforms can never silently drift apart.
 *
 * These mirror the visual defaults baked into the native views
 * (`DrumPickerDefaults` in Kotlin / Swift). Keep them in sync if those change.
 */
export const DRUM_PICKER_DEFAULTS = {
  selectedIndex: 0,
  itemHeight: 44,
  visibleItemCount: 5,
  textColor: '#8E8E93',
  selectedTextColor: '#1C1C1E',
  textSize: 20,
  selectedTextSize: 22,
  showSelectionIndicator: true,
  selectionIndicatorColor: '#D1D1D6',
  selectionIndicatorHeight: 1,
  backgroundColor: 'transparent',
  itemBackgroundColor: 'transparent',
  containerBackgroundColor: 'transparent',
  hapticFeedback: false,
  accessibilityLabel: 'Picker',
} as const;
