import { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { DrumPicker } from './DrumPicker';
import type { DrumPickerChangeEvent } from './types';

export type DateDrumPickerMode =
  | 'day'
  | 'month'
  | 'year'
  | 'day-month'
  | 'month-year'
  | 'day-month-year'
  | 'month-day-year'
  | 'year-month-day';

export type DateDrumPickerValue = {
  day?: number;
  month?: number;
  year?: number;
};

export type DateDrumPickerMonthFormat = 'short' | 'long' | 'number';

export type DateDrumPickerProps = {
  mode?: DateDrumPickerMode;
  value?: DateDrumPickerValue;
  onChange?: (value: DateDrumPickerValue) => void;
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
  style?: StyleProp<ViewStyle>;
  columnStyle?: StyleProp<ViewStyle>;
};

type DateColumnKey = 'day' | 'month' | 'year';

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

function clampDay(day: number): number {
  return Math.min(31, Math.max(1, Math.round(day)));
}

function clampMonth(month: number): number {
  return Math.min(12, Math.max(1, Math.round(month)));
}

function clampYear(year: number, minYear: number, maxYear: number): number {
  return Math.min(maxYear, Math.max(minYear, Math.round(year)));
}

export function clampDateDrumPickerValue(
  value: DateDrumPickerValue,
  minYear: number,
  maxYear: number
): Required<DateDrumPickerValue> {
  const now = new Date();
  return {
    day: clampDay(value.day ?? now.getDate()),
    month: clampMonth(value.month ?? now.getMonth() + 1),
    year: clampYear(value.year ?? now.getFullYear(), minYear, maxYear),
  };
}

function buildDayItems(): string[] {
  return Array.from({ length: 31 }, (_, index) => String(index + 1));
}

function buildMonthItems(
  monthFormat: DateDrumPickerMonthFormat,
  locale: string
): string[] {
  if (monthFormat === 'number') {
    return Array.from({ length: 12 }, (_, index) =>
      String(index + 1).padStart(2, '0')
    );
  }

  const monthStyle = monthFormat === 'long' ? 'long' : 'short';
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2020, index, 1);
    return new Intl.DateTimeFormat(locale, { month: monthStyle }).format(date);
  });
}

function buildYearItems(minYear: number, maxYear: number): string[] {
  const length = maxYear - minYear + 1;
  return Array.from({ length }, (_, index) => String(minYear + index));
}

function parseMonthFromLabel(
  label: string,
  monthFormat: DateDrumPickerMonthFormat,
  monthItems: string[]
): number {
  if (monthFormat === 'number') {
    return clampMonth(Number.parseInt(label, 10));
  }
  const index = monthItems.indexOf(label);
  return index >= 0 ? index + 1 : 1;
}

export function DateDrumPicker({
  mode = 'day-month-year',
  value,
  onChange,
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
  style,
  columnStyle,
}: DateDrumPickerProps) {
  const currentYear = new Date().getFullYear();
  const minYear = minYearProp ?? currentYear - 100;
  const maxYear = maxYearProp ?? currentYear + 50;

  const resolvedValue = useMemo(
    () => clampDateDrumPickerValue(value ?? {}, minYear, maxYear),
    [value, minYear, maxYear]
  );

  const columns = COLUMN_ORDER[mode];
  const dayItems = useMemo(() => buildDayItems(), []);
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
      onChange?.(
        clampDateDrumPickerValue(
          { ...resolvedValue, ...patch },
          minYear,
          maxYear
        )
      );
    },
    [onChange, resolvedValue, minYear, maxYear]
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
  };

  const renderColumn = (column: DateColumnKey) => {
    const columnWidth = COLUMN_WIDTH[column];

    if (column === 'day') {
      return (
        <DrumPicker
          key="day"
          {...sharedPickerProps}
          style={[
            styles.column,
            { width: columnWidth, height: pickerHeight },
            columnStyle,
          ]}
          items={dayItems}
          selectedIndex={resolvedValue.day - 1}
          onChange={(event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
            const day = clampDay(event.nativeEvent.index + 1);
            emitChange({ day });
          }}
        />
      );
    }

    if (column === 'month') {
      return (
        <DrumPicker
          key="month"
          {...sharedPickerProps}
          style={[
            styles.column,
            { width: columnWidth, height: pickerHeight },
            columnStyle,
          ]}
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
        />
      );
    }

    return (
      <DrumPicker
        key="year"
        {...sharedPickerProps}
        style={[
          styles.column,
          { width: columnWidth, height: pickerHeight },
          columnStyle,
        ]}
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
      />
    );
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
