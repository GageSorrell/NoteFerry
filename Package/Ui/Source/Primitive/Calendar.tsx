/**
 * Ported from `@notion-kit/ui`'s `primitives/calendar.tsx`. Source wraps
 * `react-day-picker` (a DOM-only date grid); the RN equivalent named in
 * the port plan is `react-native-calendars`' `Calendar`, themed to match
 * `Token.Semantic` instead of source's Tailwind classes. Trimmed to a
 * single controlled `Value: Date | undefined` (source also supports
 * range/multi-select via `react-day-picker`'s `mode` prop) — no in-scope
 * consumer needs range selection yet; this can grow a `Mode` prop later
 * without breaking the single-select shape.
 *
 * @module @notivex/ui/Primitive/Calendar
 *
 * @file      Calendar.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { type DateData, Calendar as RNCalendar } from "react-native-calendars";
import { type StyleProp, type ViewStyle } from "react-native";
import { UseColor } from "../ThemeProvider.js";
import { format } from "date-fns";

/**
 * `react-native-calendars` doesn't export its `Theme` type from the package root; derived from
 * the component's own props instead of a deep `src/types` import.
 */
type RnCalendarTheme = NonNullable<React.ComponentProps<typeof RNCalendar>[ "theme" ]>;

const ToDateKey = (Value: Date): string => format(Value, "yyyy-MM-dd");

/** {@inheritDoc Calendar} */
export interface CalendarProps
{
    readonly Value?: Date;
    readonly DefaultValue?: Date;
    readonly OnValueChange?: (Value: Date) => void;
    readonly MinDate?: Date;
    readonly MaxDate?: Date;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const Calendar = ({
    Value,
    DefaultValue,
    OnValueChange,
    MinDate,
    MaxDate,
    Style
}: CalendarProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState(DefaultValue);
    const CurrentValue = Value ?? UncontrolledValue;

    const PrimaryColor = UseColor(Semantic.Primary);
    const MutedColor = UseColor(Semantic.Muted);
    const BlueColor = UseColor(Semantic.Blue);

    const CalendarTheme = React.useMemo<RnCalendarTheme>(() => ({
        arrowColor: PrimaryColor,
        calendarBackground: "transparent",
        dayTextColor: PrimaryColor,
        monthTextColor: PrimaryColor,
        selectedDayBackgroundColor: BlueColor,
        selectedDayTextColor: "#FFFFFF",
        textDisabledColor: MutedColor,
        textInactiveColor: MutedColor,
        textSectionTitleColor: MutedColor,
        todayTextColor: BlueColor
    }), [ PrimaryColor, MutedColor, BlueColor ]);

    const MarkedDates = React.useMemo(() => CurrentValue === undefined
        ? { }
        : { [ ToDateKey(CurrentValue) ]: { selected: true } },
    [ CurrentValue ]);

    const HandleDayPress = React.useCallback((Day: DateData) =>
    {
        const NextValue = new Date(Day.year, Day.month - 1, Day.day);
        SetUncontrolledValue(NextValue);
        OnValueChange?.(NextValue);
    }, [ OnValueChange ]);

    return (
        <RNCalendar
            { ...(CurrentValue === undefined ? {} : { current: ToDateKey(CurrentValue) }) }
            { ...(MinDate === undefined ? {} : { minDate: ToDateKey(MinDate) }) }
            { ...(MaxDate === undefined ? {} : { maxDate: ToDateKey(MaxDate) }) }
            enableSwipeMonths
            markedDates={ MarkedDates }
            onDayPress={ HandleDayPress }
            style={ Style }
            theme={ CalendarTheme }
        />
    );
};
