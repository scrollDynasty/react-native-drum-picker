import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { DrumPicker } from './DrumPicker';
import {
  buildHourItems,
  buildMinuteItems,
  buildPeriodItems,
  buildSecondItems,
  clampTimeValue,
  from12Hour,
  hourIndex,
  minuteIndex,
  normalizeInterval,
  periodIndex,
  to12Hour,
  type TimeDrumPickerHourFormat,
  type TimeDrumPickerInterval,
  type TimeDrumPickerPeriod,
  type TimeDrumPickerValue,
} from './timeDrumPickerLogic';
import type { DrumPickerChangeEvent } from './types';

export type {
  TimeDrumPickerHourFormat,
  TimeDrumPickerInterval,
  TimeDrumPickerPeriod,
  TimeDrumPickerValue,
};

export type TimeDrumPickerMode =
  | 'hour'
  | 'minute'
  | 'hour-minute'
  | 'hour-minute-second'
  | 'hour-minute-period'
  | 'hour-minute-second-period';

export type TimeDrumPickerColumnKey = 'hour' | 'minute' | 'second' | 'period';

export type TimeDrumPickerProps = {
  mode?: TimeDrumPickerMode;
  value?: TimeDrumPickerValue;
  onChange?: (value: Required<TimeDrumPickerValue>) => void;
  /**
   * Force 12-hour or 24-hour hour column. Defaults to 12-hour when the mode
   * includes a period column, otherwise 24-hour.
   */
  hourFormat?: TimeDrumPickerHourFormat;
  minuteInterval?: TimeDrumPickerInterval;
  secondInterval?: TimeDrumPickerInterval;
  /** Pad single-digit values with a leading zero. Defaults to `true`. */
  padWithZero?: boolean;
  amLabel?: string;
  pmLabel?: string;
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
  style?: StyleProp<ViewStyle>;
  columnStyle?: StyleProp<ViewStyle>;
  columnStyles?: Partial<Record<TimeDrumPickerColumnKey, StyleProp<ViewStyle>>>;
  columnTestIDs?: Partial<Record<TimeDrumPickerColumnKey, string>>;
  /**
   * Accessibility labels per column. Defaults to `Hour` / `Minute` /
   * `Second` / `AM/PM` so each wheel is distinguishable to assistive tech
   * instead of all reading "Picker".
   */
  columnAccessibilityLabels?: Partial<
    Record<TimeDrumPickerColumnKey, string>
  >;
};

const DEFAULT_COLUMN_ACCESSIBILITY_LABELS: Record<
  TimeDrumPickerColumnKey,
  string
> = {
  hour: 'Hour',
  minute: 'Minute',
  second: 'Second',
  period: 'AM/PM',
};

const COLUMN_ORDER: Record<TimeDrumPickerMode, TimeDrumPickerColumnKey[]> = {
  'hour': ['hour'],
  'minute': ['minute'],
  'hour-minute': ['hour', 'minute'],
  'hour-minute-second': ['hour', 'minute', 'second'],
  'hour-minute-period': ['hour', 'minute', 'period'],
  'hour-minute-second-period': ['hour', 'minute', 'second', 'period'],
};

const COLUMN_WIDTH: Record<TimeDrumPickerColumnKey, number> = {
  hour: 72,
  minute: 72,
  second: 72,
  period: 72,
};

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEM_COUNT = 5;

function defaultHourFormat(mode: TimeDrumPickerMode): TimeDrumPickerHourFormat {
  return mode === 'hour-minute-period' || mode === 'hour-minute-second-period'
    ? '12'
    : '24';
}

export function TimeDrumPicker({
  mode = 'hour-minute',
  value,
  onChange,
  hourFormat,
  minuteInterval,
  secondInterval,
  padWithZero = true,
  amLabel = 'AM',
  pmLabel = 'PM',
  itemHeight = DEFAULT_ITEM_HEIGHT,
  visibleItemCount = DEFAULT_VISIBLE_ITEM_COUNT,
  textColor,
  selectedTextColor,
  textSize,
  selectedTextSize,
  showSelectionIndicator,
  selectionIndicatorColor,
  selectionIndicatorHeight,
  backgroundColor = 'transparent',
  itemBackgroundColor = 'transparent',
  containerBackgroundColor = 'transparent',
  hapticFeedback = false,
  style,
  columnStyle,
  columnStyles,
  columnTestIDs,
  columnAccessibilityLabels,
}: TimeDrumPickerProps) {
  const resolvedHourFormat = hourFormat ?? defaultHourFormat(mode);
  const normalizedMinuteInterval = useMemo(
    () => normalizeInterval(minuteInterval),
    [minuteInterval]
  );
  const normalizedSecondInterval = useMemo(
    () => normalizeInterval(secondInterval),
    [secondInterval]
  );

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    clampTimeValue(
      value ?? undefined,
      normalizedMinuteInterval,
      normalizedSecondInterval
    )
  );

  const resolvedValue = useMemo(() => {
    if (isControlled) {
      return clampTimeValue(
        value,
        normalizedMinuteInterval,
        normalizedSecondInterval
      );
    }
    return internalValue;
  }, [
    isControlled,
    value,
    internalValue,
    normalizedMinuteInterval,
    normalizedSecondInterval,
  ]);

  const columns = COLUMN_ORDER[mode];
  const hourItems = useMemo(
    () => buildHourItems(resolvedHourFormat, padWithZero),
    [resolvedHourFormat, padWithZero]
  );
  const minuteItems = useMemo(
    () => buildMinuteItems(normalizedMinuteInterval, padWithZero),
    [normalizedMinuteInterval, padWithZero]
  );
  const secondItems = useMemo(
    () => buildSecondItems(normalizedSecondInterval, padWithZero),
    [normalizedSecondInterval, padWithZero]
  );
  const periodItems = useMemo(
    () => buildPeriodItems(amLabel, pmLabel),
    [amLabel, pmLabel]
  );

  const pickerHeight = itemHeight * visibleItemCount;

  const emitChange = useCallback(
    (patch: Partial<TimeDrumPickerValue>) => {
      const next = clampTimeValue(
        { ...resolvedValue, ...patch },
        normalizedMinuteInterval,
        normalizedSecondInterval
      );
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [
      resolvedValue,
      normalizedMinuteInterval,
      normalizedSecondInterval,
      isControlled,
      onChange,
    ]
  );

  // Controlled callers may pass an out-of-range minute / hour. Mirror the
  // DateDrumPicker behavior of clamping once and notifying so state stays in
  // sync with what the picker actually displays.
  useEffect(() => {
    if (!isControlled || !onChange || value === undefined) {
      return;
    }
    const clamped = clampTimeValue(
      value,
      normalizedMinuteInterval,
      normalizedSecondInterval
    );
    const hour = value.hour ?? clamped.hour;
    const minute = value.minute ?? clamped.minute;
    const second = value.second ?? clamped.second;
    if (
      hour !== clamped.hour ||
      minute !== clamped.minute ||
      second !== clamped.second
    ) {
      onChange(clamped);
    }
  }, [
    isControlled,
    onChange,
    value,
    normalizedMinuteInterval,
    normalizedSecondInterval,
  ]);

  const sharedPickerProps = {
    itemHeight,
    visibleItemCount,
    textColor,
    selectedTextColor,
    textSize,
    selectedTextSize,
    showSelectionIndicator,
    selectionIndicatorColor,
    selectionIndicatorHeight,
    backgroundColor,
    itemBackgroundColor,
    containerBackgroundColor,
    hapticFeedback,
  };

  const columnContainerStyle = (
    column: TimeDrumPickerColumnKey
  ): StyleProp<ViewStyle> => [
    styles.column,
    { width: COLUMN_WIDTH[column], height: pickerHeight },
    columnStyle,
    columnStyles?.[column],
  ];

  const columnAccessibilityLabel = (
    column: TimeDrumPickerColumnKey
  ): string =>
    columnAccessibilityLabels?.[column] ??
    DEFAULT_COLUMN_ACCESSIBILITY_LABELS[column];

  const renderHour = () => (
    <DrumPicker
      key="hour"
      {...sharedPickerProps}
      testID={columnTestIDs?.hour}
      accessibilityLabel={columnAccessibilityLabel('hour')}
      style={columnContainerStyle('hour')}
      items={hourItems}
      selectedIndex={hourIndex(resolvedValue.hour, resolvedHourFormat)}
      onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        const index = event.nativeEvent.index;
        if (resolvedHourFormat === '24') {
          emitChange({ hour: Math.min(23, Math.max(0, index)) });
          return;
        }
        const hour12 = Math.min(12, Math.max(1, index + 1));
        const period = to12Hour(resolvedValue.hour).period;
        emitChange({ hour: from12Hour(hour12, period) });
      }}
    />
  );

  const renderMinute = () => (
    <DrumPicker
      key="minute"
      {...sharedPickerProps}
      testID={columnTestIDs?.minute}
      accessibilityLabel={columnAccessibilityLabel('minute')}
      style={columnContainerStyle('minute')}
      items={minuteItems}
      selectedIndex={minuteIndex(
        resolvedValue.minute,
        normalizedMinuteInterval
      )}
      onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        const minute = Math.min(
          59,
          Math.max(0, event.nativeEvent.index * normalizedMinuteInterval)
        );
        emitChange({ minute });
      }}
    />
  );

  const renderSecond = () => (
    <DrumPicker
      key="second"
      {...sharedPickerProps}
      testID={columnTestIDs?.second}
      accessibilityLabel={columnAccessibilityLabel('second')}
      style={columnContainerStyle('second')}
      items={secondItems}
      selectedIndex={minuteIndex(
        resolvedValue.second,
        normalizedSecondInterval
      )}
      onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        const second = Math.min(
          59,
          Math.max(0, event.nativeEvent.index * normalizedSecondInterval)
        );
        emitChange({ second });
      }}
    />
  );

  const renderPeriod = () => (
    <DrumPicker
      key="period"
      {...sharedPickerProps}
      testID={columnTestIDs?.period}
      accessibilityLabel={columnAccessibilityLabel('period')}
      style={columnContainerStyle('period')}
      items={periodItems}
      selectedIndex={periodIndex(resolvedValue.hour)}
      onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
        const nextPeriod: TimeDrumPickerPeriod =
          event.nativeEvent.index === 0 ? 'AM' : 'PM';
        const { hour12 } = to12Hour(resolvedValue.hour);
        emitChange({ hour: from12Hour(hour12, nextPeriod) });
      }}
    />
  );

  const renderColumn = (column: TimeDrumPickerColumnKey) => {
    switch (column) {
      case 'hour':
        return renderHour();
      case 'minute':
        return renderMinute();
      case 'second':
        return renderSecond();
      case 'period':
        return renderPeriod();
    }
  };

  return (
    <View style={[styles.row, style]}>
      {columns.map((column) => renderColumn(column))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  column: {
    backgroundColor: 'transparent',
  },
});
