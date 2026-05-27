import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  buildDayItems,
  buildMonthItems,
  buildYearItems,
  clampDateDrumPickerValue,
  clampDayForMonth,
  clampYear,
  normalizeYearRange,
  parseMonthFromLabel,
  type DateDrumPickerMonthFormat,
  type DateDrumPickerValue,
} from './dateDrumPickerLogic';
import { DrumPicker } from './DrumPicker';
import type {
  DateDrumPickerRef,
  DrumPickerChangeEvent,
  DrumPickerRef,
} from './types';

export type DateDrumPickerMode =
  | 'day'
  | 'month'
  | 'year'
  | 'day-month'
  | 'month-year'
  | 'day-month-year'
  | 'month-day-year'
  | 'year-month-day';

export type { DateDrumPickerMonthFormat, DateDrumPickerValue };
export {
  clampDateDrumPickerValue,
  getDaysInMonth,
  normalizeYearRange,
} from './dateDrumPickerLogic';

export type DateDrumPickerColumnKey = 'day' | 'month' | 'year';

export type DateDrumPickerProps = {
  mode?: DateDrumPickerMode;
  value?: DateDrumPickerValue;
  onChange?: (value: DateDrumPickerValue) => void;
  /**
   * Fires while a column is scrolling. First argument identifies the column.
   */
  onValueChanging?: (
    column: DateDrumPickerColumnKey,
    event: NativeSyntheticEvent<DrumPickerChangeEvent>
  ) => void;
  minYear?: number;
  maxYear?: number;
  monthFormat?: DateDrumPickerMonthFormat;
  locale?: string;
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
  enableScrollByTapOnItem?: boolean;
  style?: StyleProp<ViewStyle>;
  columnStyle?: StyleProp<ViewStyle>;
  columnStyles?: Partial<Record<DateDrumPickerColumnKey, StyleProp<ViewStyle>>>;
  columnTestIDs?: Partial<Record<DateDrumPickerColumnKey, string>>;
};

type DateColumnKey = DateDrumPickerColumnKey;

const COLUMN_ORDER: Record<DateDrumPickerMode, DateColumnKey[]> = {
  'day': ['day'],
  'month': ['month'],
  'year': ['year'],
  'day-month': ['day', 'month'],
  'month-year': ['month', 'year'],
  'day-month-year': ['day', 'month', 'year'],
  'month-day-year': ['month', 'day', 'year'],
  'year-month-day': ['year', 'month', 'day'],
};

const COLUMN_WIDTH: Record<DateColumnKey, number> = {
  day: 64,
  month: 110,
  year: 86,
};

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEM_COUNT = 5;

export const DateDrumPicker = forwardRef<DateDrumPickerRef, DateDrumPickerProps>(
  function DateDrumPicker(
    {
      mode = 'day-month-year',
      value,
      onChange,
      onValueChanging,
      minYear: minYearProp,
      maxYear: maxYearProp,
      monthFormat = 'short',
      locale = 'en',
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
      enableScrollByTapOnItem = false,
      style,
      columnStyle,
      columnStyles,
      columnTestIDs,
    },
    ref
  ) {
  const dayRef = useRef<DrumPickerRef>(null);
  const monthRef = useRef<DrumPickerRef>(null);
  const yearRef = useRef<DrumPickerRef>(null);
  const currentYear = new Date().getFullYear();
  const { minYear, maxYear } = useMemo(
    () =>
      normalizeYearRange(
        minYearProp ?? currentYear - 100,
        maxYearProp ?? currentYear + 50
      ),
    [minYearProp, maxYearProp, currentYear]
  );

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    clampDateDrumPickerValue(value ?? {}, minYear, maxYear)
  );

  const resolvedValue = useMemo(() => {
    if (isControlled) {
      return clampDateDrumPickerValue(value, minYear, maxYear);
    }
    return internalValue;
  }, [isControlled, value, internalValue, minYear, maxYear]);

  const columns = COLUMN_ORDER[mode];
  const dayItems = useMemo(
    () => buildDayItems(resolvedValue.month, resolvedValue.year),
    [resolvedValue.month, resolvedValue.year]
  );
  const monthItems = useMemo(
    () => buildMonthItems(monthFormat, locale),
    [monthFormat, locale]
  );
  const yearItems = useMemo(
    () => buildYearItems(minYear, maxYear),
    [minYear, maxYear]
  );

  const pickerHeight = itemHeight * visibleItemCount;

  const emitChange = useCallback(
    (patch: Partial<DateDrumPickerValue>) => {
      const next = clampDateDrumPickerValue(
        { ...resolvedValue, ...patch },
        minYear,
        maxYear
      );
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange, resolvedValue, minYear, maxYear]
  );

  // Controlled: parent may pass day 31 + April — clamp and notify once.
  useEffect(() => {
    if (!isControlled || !onChange || value === undefined) {
      return;
    }
    const clamped = clampDateDrumPickerValue(value, minYear, maxYear);
    const day = value.day ?? clamped.day;
    const month = value.month ?? clamped.month;
    const year = value.year ?? clamped.year;
    if (
      day !== clamped.day ||
      month !== clamped.month ||
      year !== clamped.year
    ) {
      onChange(clamped);
    }
  }, [isControlled, onChange, value, minYear, maxYear]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToDate(date, options = {}) {
        if (date.day != null) {
          dayRef.current?.scrollToIndex(date.day - 1, options);
        }
        if (date.month != null) {
          monthRef.current?.scrollToIndex(date.month - 1, options);
        }
        if (date.year != null) {
          const yearIndex = date.year - minYear;
          if (yearIndex >= 0 && yearIndex < yearItems.length) {
            yearRef.current?.scrollToIndex(yearIndex, options);
          }
        }
      },
      getCurrentDate() {
        const day = columns.includes('day')
          ? (dayRef.current?.getCurrentIndex() ?? resolvedValue.day - 1) + 1
          : (resolvedValue.day ?? 1);
        const month = columns.includes('month')
          ? (monthRef.current?.getCurrentIndex() ?? resolvedValue.month - 1) + 1
          : (resolvedValue.month ?? 1);
        const year = columns.includes('year')
          ? minYear + (yearRef.current?.getCurrentIndex() ?? 0)
          : (resolvedValue.year ?? minYear);
        return { day, month, year };
      },
    }),
    [columns, minYear, resolvedValue, yearItems.length]
  );

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
    enableScrollByTapOnItem,
  };

  const columnContainerStyle = (
    column: DateColumnKey
  ): StyleProp<ViewStyle> => [
    styles.column,
    { width: COLUMN_WIDTH[column], height: pickerHeight },
    columnStyle,
    columnStyles?.[column],
  ];

  const renderColumn = (column: DateColumnKey) => {
    if (column === 'day') {
      return (
        <DrumPicker
          ref={dayRef}
          key="day"
          {...sharedPickerProps}
          testID={columnTestIDs?.day}
          style={columnContainerStyle('day')}
          items={dayItems}
          selectedIndex={Math.min(resolvedValue.day - 1, dayItems.length - 1)}
          onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
            const day = clampDayForMonth(
              event.nativeEvent.index + 1,
              resolvedValue.month,
              resolvedValue.year
            );
            emitChange({ day });
          }}
          onValueChanging={
            onValueChanging != null
              ? (event) => onValueChanging('day', event)
              : undefined
          }
        />
      );
    }

    if (column === 'month') {
      return (
        <DrumPicker
          ref={monthRef}
          key="month"
          {...sharedPickerProps}
          testID={columnTestIDs?.month}
          style={columnContainerStyle('month')}
          items={monthItems}
          selectedIndex={resolvedValue.month - 1}
          onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
            const month = parseMonthFromLabel(
              event.nativeEvent.value,
              monthFormat,
              monthItems
            );
            emitChange({ month });
          }}
          onValueChanging={
            onValueChanging != null
              ? (event) => onValueChanging('month', event)
              : undefined
          }
        />
      );
    }

    return (
      <DrumPicker
        ref={yearRef}
        key="year"
        {...sharedPickerProps}
        testID={columnTestIDs?.year}
        style={columnContainerStyle('year')}
        items={yearItems}
        selectedIndex={resolvedValue.year - minYear}
        onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
          const year = clampYear(
            minYear + event.nativeEvent.index,
            minYear,
            maxYear
          );
          emitChange({ year });
        }}
        onValueChanging={
          onValueChanging != null
            ? (event) => onValueChanging('year', event)
            : undefined
        }
      />
    );
  };

  return (
    <View style={[styles.row, style]}>
      {columns.map((column) => renderColumn(column))}
    </View>
  );
  }
);

DateDrumPicker.displayName = 'DateDrumPicker';

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
