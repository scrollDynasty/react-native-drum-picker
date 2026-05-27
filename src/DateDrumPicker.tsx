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
import { clampToConstraints, resolveConstraints } from './dateConstraints';
import {
  buildDayItemsInRange,
  buildMonthItemsInRange,
  buildYearItems,
  clampDateDrumPickerValue,
  type DateDrumPickerMonthFormat,
  type DateDrumPickerValue,
} from './dateDrumPickerLogic';
import { DrumPicker } from './DrumPicker.native';
import type {
  DateConstraint,
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
export type { DateConstraint } from './types';
export { clampToConstraints, resolveConstraints } from './dateConstraints';
export type { ResolvedConstraint } from './dateConstraints';

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
  /**
   * Minimum selectable date (inclusive). Partial fields use defaults
   * (day=1, month=1; year from `minYear` or now−100 when only legacy props).
   * Takes precedence over `minYear` when both are set.
   */
  minDate?: DateConstraint;
  /**
   * Maximum selectable date (inclusive). Partial fields use defaults
   * (day=31, month=12; year from `maxYear` or now+50 when only legacy props).
   * Takes precedence over `maxYear` when both are set.
   */
  maxDate?: DateConstraint;
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

export const DateDrumPicker = forwardRef<
  DateDrumPickerRef,
  DateDrumPickerProps
>(function DateDrumPicker(
  {
    mode = 'day-month-year',
    value,
    onChange,
    onValueChanging,
    minYear: minYearProp,
    maxYear: maxYearProp,
    minDate,
    maxDate,
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
  const constraints = useMemo(() => {
    const min =
      minDate ??
      (minYearProp != null
        ? { year: minYearProp }
        : { year: currentYear - 100 });
    const max =
      maxDate ??
      (maxYearProp != null
        ? { year: maxYearProp }
        : { year: currentYear + 50 });
    return resolveConstraints(min, max);
  }, [minDate, maxDate, minYearProp, maxYearProp, currentYear]);

  const minYear = constraints.minYear;
  const maxYear = constraints.maxYear;

  const constraintKey = useMemo(
    () =>
      JSON.stringify({
        minDate,
        maxDate,
        minYear: minYearProp,
        maxYear: maxYearProp,
        currentYear,
      }),
    [minDate, maxDate, minYearProp, maxYearProp, currentYear]
  );

  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    if (minDate != null && minYearProp != null) {
      console.warn(
        'DateDrumPicker: minDate takes precedence over minYear when both are set.'
      );
    }
    if (maxDate != null && maxYearProp != null) {
      console.warn(
        'DateDrumPicker: maxDate takes precedence over maxYear when both are set.'
      );
    }
  }, [minDate, maxDate, minYearProp, maxYearProp]);

  const clampValue = useCallback(
    (input: DateDrumPickerValue | undefined) => {
      const calendar = clampDateDrumPickerValue(input ?? {}, minYear, maxYear);
      return clampToConstraints(calendar, constraints);
    },
    [constraints, minYear, maxYear]
  );

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => clampValue(value));
  const internalValueRef = useRef(internalValue);
  internalValueRef.current = internalValue;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastControlledClampNotifyRef = useRef<string | null>(null);

  const resolvedValue = useMemo(() => {
    if (isControlled) {
      return clampValue(value);
    }
    return internalValue;
  }, [isControlled, value, internalValue, clampValue]);

  const columns = COLUMN_ORDER[mode];
  const monthRange = useMemo(
    () => ({
      min: constraints.minMonth(resolvedValue.year),
      max: constraints.maxMonth(resolvedValue.year),
    }),
    [constraints, resolvedValue.year]
  );
  const dayRange = useMemo(
    () => ({
      min: constraints.minDay(resolvedValue.year, resolvedValue.month),
      max: constraints.maxDay(resolvedValue.year, resolvedValue.month),
    }),
    [constraints, resolvedValue.month, resolvedValue.year]
  );
  const dayItems = useMemo(
    () => buildDayItemsInRange(dayRange.min, dayRange.max),
    [dayRange.min, dayRange.max]
  );
  const monthItems = useMemo(
    () =>
      buildMonthItemsInRange(
        monthRange.min,
        monthRange.max,
        monthFormat,
        locale
      ),
    [monthRange.min, monthRange.max, monthFormat, locale]
  );
  const yearItems = useMemo(
    () => buildYearItems(minYear, maxYear),
    [minYear, maxYear]
  );

  const pickerHeight = itemHeight * visibleItemCount;

  const emitChange = useCallback(
    (patch: Partial<DateDrumPickerValue>) => {
      const next = clampValue({ ...resolvedValue, ...patch });
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [clampValue, isControlled, onChange, resolvedValue]
  );

  // Clamp when constraints change (uncontrolled) and notify parent.
  useEffect(() => {
    if (isControlled) {
      return;
    }
    const prev = internalValueRef.current;
    const clamped = clampValue(prev);
    if (
      clamped.day === prev.day &&
      clamped.month === prev.month &&
      clamped.year === prev.year
    ) {
      return;
    }
    setInternalValue(clamped);
    onChangeRef.current?.(clamped);
  }, [clampValue, constraintKey, isControlled]);

  // Controlled: parent may pass invalid date — clamp and notify once per distinct invalid value.
  useEffect(() => {
    if (!isControlled || !onChange || value === undefined) {
      lastControlledClampNotifyRef.current = null;
      return;
    }
    const clamped = clampValue(value);
    const day = value.day ?? clamped.day;
    const month = value.month ?? clamped.month;
    const year = value.year ?? clamped.year;
    if (
      day === clamped.day &&
      month === clamped.month &&
      year === clamped.year
    ) {
      lastControlledClampNotifyRef.current = null;
      return;
    }
    const notifyKey = `${day}-${month}-${year}->${clamped.day}-${clamped.month}-${clamped.year}`;
    if (lastControlledClampNotifyRef.current === notifyKey) {
      return;
    }
    lastControlledClampNotifyRef.current = notifyKey;
    onChangeRef.current?.(clamped);
    // onChange is read via onChangeRef to avoid re-clamp when callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampValue, constraintKey, isControlled, value]);

  const readDateFromColumns = useCallback((): DateDrumPickerValue => {
    const day = columns.includes('day')
      ? dayRange.min +
        (dayRef.current?.getCurrentIndex() ?? resolvedValue.day - dayRange.min)
      : resolvedValue.day;
    const month = columns.includes('month')
      ? monthRange.min +
        (monthRef.current?.getCurrentIndex() ??
          resolvedValue.month - monthRange.min)
      : resolvedValue.month;
    const year = columns.includes('year')
      ? minYear +
        (yearRef.current?.getCurrentIndex() ?? resolvedValue.year - minYear)
      : resolvedValue.year;
    return { day, month, year };
  }, [columns, dayRange.min, minYear, monthRange.min, resolvedValue]);

  const syncDateAfterImperativeScroll = useCallback(
    (options?: { animated?: boolean }) => {
      const raw = readDateFromColumns();
      const clamped = clampValue(raw);
      const minD = constraints.minDay(clamped.year, clamped.month);
      if (columns.includes('day') && clamped.day !== raw.day) {
        dayRef.current?.scrollToIndex(clamped.day - minD, options);
      }
      const minM = constraints.minMonth(clamped.year);
      if (columns.includes('month') && clamped.month !== raw.month) {
        monthRef.current?.scrollToIndex(clamped.month - minM, options);
      }
      if (!isControlled) {
        setInternalValue(clamped);
      }
      onChange?.(clamped);
      return clamped;
    },
    [
      clampValue,
      columns,
      constraints,
      isControlled,
      onChange,
      readDateFromColumns,
    ]
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToDate(date, options = {}) {
        if (date.year != null && columns.includes('year')) {
          const yearIndex = date.year - minYear;
          if (yearIndex >= 0 && yearIndex < yearItems.length) {
            yearRef.current?.scrollToIndex(yearIndex, options);
          }
        }
        if (date.month != null && columns.includes('month')) {
          const year = date.year ?? resolvedValue.year;
          const minM = constraints.minMonth(year);
          monthRef.current?.scrollToIndex(date.month - minM, options);
        }
        if (date.day != null && columns.includes('day')) {
          const year = date.year ?? resolvedValue.year;
          const month = date.month ?? resolvedValue.month;
          const minD = constraints.minDay(year, month);
          dayRef.current?.scrollToIndex(date.day - minD, options);
        }
        syncDateAfterImperativeScroll(options);
      },
      getCurrentDate() {
        return clampValue(readDateFromColumns());
      },
    }),
    [
      clampValue,
      columns,
      constraints,
      minYear,
      readDateFromColumns,
      resolvedValue,
      syncDateAfterImperativeScroll,
      yearItems.length,
    ]
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

  const mapValueChangingEvent = useCallback(
    (
      event: NativeSyntheticEvent<DrumPickerChangeEvent>,
      absoluteIndex: number,
      absoluteValue: string
    ): NativeSyntheticEvent<DrumPickerChangeEvent> => ({
      ...event,
      nativeEvent: {
        index: absoluteIndex,
        value: absoluteValue,
      },
    }),
    []
  );

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
          selectedIndex={Math.min(
            resolvedValue.day - dayRange.min,
            Math.max(dayItems.length - 1, 0)
          )}
          onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
            const day = dayRange.min + event.nativeEvent.index;
            emitChange({ day });
          }}
          onValueChanging={
            onValueChanging != null
              ? (event) => {
                  const day = dayRange.min + event.nativeEvent.index;
                  onValueChanging(
                    'day',
                    mapValueChangingEvent(event, day - 1, String(day))
                  );
                }
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
          selectedIndex={Math.min(
            resolvedValue.month - monthRange.min,
            Math.max(monthItems.length - 1, 0)
          )}
          onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
            const month = monthRange.min + event.nativeEvent.index;
            emitChange({ month });
          }}
          onValueChanging={
            onValueChanging != null
              ? (event) => {
                  const month = monthRange.min + event.nativeEvent.index;
                  const label =
                    monthItems[event.nativeEvent.index] ??
                    event.nativeEvent.value;
                  onValueChanging(
                    'month',
                    mapValueChangingEvent(event, month - 1, label)
                  );
                }
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
          const year = minYear + event.nativeEvent.index;
          emitChange({ year });
        }}
        onValueChanging={
          onValueChanging != null
            ? (event) => {
                const year = minYear + event.nativeEvent.index;
                onValueChanging(
                  'year',
                  mapValueChangingEvent(event, year - minYear, String(year))
                );
              }
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
});

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
