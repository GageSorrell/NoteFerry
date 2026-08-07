/**
 * Ported from `@notion-kit/ui`'s `primitives/calendar.tsx`. Source wraps
 * `react-day-picker` (a DOM-only date grid); the RN equivalent named in
 * the port plan is `react-native-calendars`' `Calendar`, themed to match
 * `Token.Semantic` instead of source's Tailwind classes.
 *
 * `Mode: "Single" | "Range"` mirrors source's `react-day-picker` `mode`
 * prop (`"single"` / `"range"`) — the file originally shipped single-select
 * only, with a note that range selection could grow in later without
 * breaking that shape once an in-scope consumer needed it. `DateSheet` (the
 * Notion-style "edit Date property" bottom sheet) is that consumer.
 * `Mode` defaults to `"Single"`, so every existing call site keeps its
 * exact current behavior unchanged.
 *
 * Range highlighting uses `react-native-calendars`' `markingType="period"`
 * (each day in the range gets its own `{ color, textColor, startingDay,
 * endingDay }` marking; the library's own `PeriodDay` renderer handles the
 * rounded-cap-at-the-ends / flat-band-between visual from those flags) —
 * see `BuildRangeMarkedDates`.
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
import { eachDayOfInterval, format, isBefore } from "date-fns";
import { UseColor } from "../ThemeProvider.js";
import { WithAlpha } from "../Utility/index.js";

/**
 * `react-native-calendars` doesn't export its `Theme` type from the package root; derived from
 * the component's own props instead of a deep `src/types` import.
 */
type RnCalendarTheme = NonNullable<React.ComponentProps<typeof RNCalendar>[ "theme" ]>;

const ToDateKey = (Value: Date): string => format(Value, "yyyy-MM-dd");

interface CalendarThemeColors
{
    readonly Theme: RnCalendarTheme;
    readonly PrimaryColor: string;
    readonly MutedColor: string;
    readonly BlueColor: string;
}

/**
 * Shared theme-color resolution for `SingleCalendar`/`RangeCalendar`, so the two
 * don't duplicate the `Semantic` → `RnCalendarTheme` mapping.
 */
const useCalendarTheme = (): CalendarThemeColors =>
{
    const PrimaryColor = UseColor(Semantic.Primary);
    const MutedColor = UseColor(Semantic.Muted);
    const BlueColor = UseColor(Semantic.Blue);

    const Theme = React.useMemo<RnCalendarTheme>(() => ({
        arrowColor: PrimaryColor,
        calendarBackground: "transparent",
        dayTextColor: PrimaryColor,
        monthTextColor: PrimaryColor,
        selectedDayBackgroundColor: BlueColor,
        selectedDayTextColor: "#FFFFFF",
        textDisabledColor: MutedColor,
        textInactiveColor: MutedColor,
        textSectionTitleColor: MutedColor,
        todayTextColor: BlueColor,

        textDayFontFamily: "Inter_400Regular",
        textDayHeaderFontFamily: "Inter_400Regular",
        textMonthFontFamily: "Inter_400Regular",
        todayButtonFontFamily: "Inter_400Regular"
    }), [ PrimaryColor, MutedColor, BlueColor ]);

    return { BlueColor, MutedColor, PrimaryColor, Theme } as const;
};

/**
 * A start/end date pair for `Calendar`'s `Mode="Range"`. Either end may be
 * `undefined` while a selection is in progress (e.g. `Start` chosen, `End`
 * not yet tapped).
 *
 * @category Input
 * @since 1.0.0
 */
export interface CalendarRange
{
    readonly Start?: Date | undefined;
    readonly End?: Date | undefined;
}

interface CalendarCommonProps
{
    readonly MinDate?: Date | undefined;
    readonly MaxDate?: Date | undefined;
    readonly Style?: StyleProp<ViewStyle> | undefined;
}

interface CalendarSingleProps extends CalendarCommonProps
{
    readonly Mode?: "Single" | undefined;
    readonly Value?: Date | undefined;
    readonly DefaultValue?: Date | undefined;
    readonly OnValueChange?: ((Value: Date) => void) | undefined;
}

interface CalendarRangeProps extends CalendarCommonProps
{
    readonly Mode: "Range";
    readonly Value?: CalendarRange | undefined;
    readonly DefaultValue?: CalendarRange | undefined;
    readonly OnValueChange?: ((Value: CalendarRange) => void) | undefined;

    /**
     * Which endpoint the next day-tap writes to. Omit all three
     * `*ActiveEndpoint*` props to fall back to `react-day-picker`'s own
     * automatic range behavior instead (tap before `Start` moves `Start`;
     * tap on/after `Start` completes `End`; tap once both are set resets
     * to a new `Start`).
     */
    readonly ActiveEndpoint?: "Start" | "End" | undefined;
    readonly DefaultActiveEndpoint?: "Start" | "End" | undefined;
    readonly OnActiveEndpointChange?: ((Endpoint: "Start" | "End") => void) | undefined;
}

/** {@inheritDoc Calendar} */
export type CalendarProps =
    | CalendarSingleProps
    | CalendarRangeProps;

const SingleCalendar = ({
    Value,
    DefaultValue,
    OnValueChange,
    MinDate,
    MaxDate,
    Style
}: CalendarSingleProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState(DefaultValue);
    const CurrentValue = Value ?? UncontrolledValue;

    const { Theme } = useCalendarTheme();

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
            { ...(CurrentValue === undefined ? { } : { current: ToDateKey(CurrentValue) }) }
            { ...(MinDate === undefined ? { } : { minDate: ToDateKey(MinDate) }) }
            { ...(MaxDate === undefined ? { } : { maxDate: ToDateKey(MaxDate) }) }
            enableSwipeMonths
            markedDates={ MarkedDates }
            onDayPress={ HandleDayPress }
            style={ Style }
            theme={ Theme }
        />
    );
};

interface RangeMarking
{
    readonly color: string;
    readonly textColor: string;
    readonly startingDay: boolean;
    readonly endingDay: boolean;
}

/**
 * One `markedDates` entry per day spanned by `Range`. The two endpoints get
 * `BlueColor` (solid, matching `SingleCalendar`'s selected-day color); days
 * strictly between them get the lighter `BandColor` — `PeriodDay` (from
 * `react-native-calendars`) renders `startingDay`/`endingDay` as rounded
 * caps and everything else as a flat, edge-to-edge band, which is exactly
 * the "range highlight" look in the reference screenshots.
 */
const BuildRangeMarkedDates = (
    Range: CalendarRange,
    BlueColor: string,
    BandColor: string,
    PrimaryColor: string
): Record<string, RangeMarking> =>
{
    if (Range.Start === undefined)
    {
        return { };
    }

    if (Range.End === undefined)
    {
        return {
            [ ToDateKey(Range.Start) ]:
                { color: BlueColor, endingDay: true, startingDay: true, textColor: "#FFFFFF" }
        };
    }

    const [ Lo, Hi ] = isBefore(Range.End, Range.Start)
        ? [ Range.End, Range.Start ]
        : [ Range.Start, Range.End ];
    const Days = eachDayOfInterval({ end: Hi, start: Lo });

    return Object.fromEntries(Days.map((Day: Date, Index: number) =>
    {
        const IsEndpoint = Index === 0 || Index === Days.length - 1;

        return [ ToDateKey(Day), {
            color: IsEndpoint ? BlueColor : BandColor,
            endingDay: Index === Days.length - 1,
            startingDay: Index === 0,
            textColor: IsEndpoint ? "#FFFFFF" : PrimaryColor
        } ];
    }));
};

/**
 * `react-day-picker`'s own default `mode="range"` selection behavior — used
 * whenever the caller doesn't drive `ActiveEndpoint` itself.
 */
const ResolveAutomaticRange = (Current: CalendarRange, Tapped: Date): CalendarRange =>
{
    if (Current.Start === undefined)
    {
        return { End: undefined, Start: Tapped };
    }

    if (Current.End === undefined)
    {
        return isBefore(Tapped, Current.Start)
            ? { End: undefined, Start: Tapped }
            : { End: Tapped, Start: Current.Start };
    }

    return { End: undefined, Start: Tapped };
};

interface TargetedRangeResult
{
    readonly Range: CalendarRange;

    /** Set only on the courtesy Start→End auto-advance described on `CalendarRangeProps.ActiveEndpoint`. */
    readonly NextActiveEndpoint?: "Start" | "End";
}

/**
 * Writes straight into whichever endpoint `ActiveEndpoint` currently names.
 * This is used whenever the caller (e.g. `DateSheet`) drives endpoint targeting itself.
 */
const ResolveTargetedRange = (
    Current: CalendarRange,
    Tapped: Date,
    ActiveEndpoint: "Start" | "End"
): TargetedRangeResult =>
{
    const Range: CalendarRange = { ...Current, [ ActiveEndpoint ]: Tapped };

    if (ActiveEndpoint === "Start" && Current.End === undefined)
    {
        return { NextActiveEndpoint: "End", Range };
    }

    return { Range };
};

const RangeCalendar = ({
    Value,
    DefaultValue,
    OnValueChange,
    ActiveEndpoint,
    DefaultActiveEndpoint,
    OnActiveEndpointChange,
    MinDate,
    MaxDate,
    Style
}: CalendarRangeProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState<CalendarRange>(DefaultValue ?? { });
    const CurrentValue = Value ?? UncontrolledValue;

    const [ UncontrolledActiveEndpoint, SetUncontrolledActiveEndpoint ] =
        React.useState<"Start" | "End" | undefined>(DefaultActiveEndpoint);
    const IsEndpointTargeted = ActiveEndpoint !== undefined
        || DefaultActiveEndpoint !== undefined
        || OnActiveEndpointChange !== undefined;
    const CurrentActiveEndpoint = ActiveEndpoint ?? UncontrolledActiveEndpoint;

    const { BlueColor, PrimaryColor, Theme } = useCalendarTheme();
    const BandColor = React.useMemo(() => WithAlpha(BlueColor, 0.16), [ BlueColor ]);

    const MarkedDates = React.useMemo(
        () => BuildRangeMarkedDates(CurrentValue, BlueColor, BandColor, PrimaryColor),
        [ CurrentValue, BlueColor, BandColor, PrimaryColor ]
    );

    const HandleDayPress = React.useCallback((Day: DateData) =>
    {
        const Tapped = new Date(Day.year, Day.month - 1, Day.day);

        if (IsEndpointTargeted && CurrentActiveEndpoint !== undefined)
        {
            const { NextActiveEndpoint, Range } =
                ResolveTargetedRange(
                    CurrentValue,
                    Tapped,
                    CurrentActiveEndpoint
                );

            SetUncontrolledValue(Range);
            OnValueChange?.(Range);

            if (NextActiveEndpoint !== undefined)
            {
                SetUncontrolledActiveEndpoint(NextActiveEndpoint);
                OnActiveEndpointChange?.(NextActiveEndpoint);
            }

            return;
        }

        const NextRange = ResolveAutomaticRange(CurrentValue, Tapped);
        SetUncontrolledValue(NextRange);
        OnValueChange?.(NextRange);
    }, [ CurrentValue, CurrentActiveEndpoint, IsEndpointTargeted, OnValueChange, OnActiveEndpointChange ]);

    return (
        <RNCalendar
            { ...(CurrentValue.Start === undefined ? {} : { current: ToDateKey(CurrentValue.Start) }) }
            { ...(MinDate === undefined ? {} : { minDate: ToDateKey(MinDate) }) }
            { ...(MaxDate === undefined ? {} : { maxDate: ToDateKey(MaxDate) }) }
            enableSwipeMonths
            markedDates={ MarkedDates }
            markingType="period"
            onDayPress={ HandleDayPress }
            style={ Style }
            theme={ Theme }
        />
    );
};

export/**
       * A single month's date grid. `Mode="Single"` (the default) selects one
       * `Date`; `Mode="Range"` selects a `CalendarRange` `{ Start, End }`, with
       * range days highlighted as a band (see `BuildRangeMarkedDates`).
       *
       * @category Component
       * @since 1.0.0
       */
const Calendar = (Props: CalendarProps): React.JSX.Element =>
    Props.Mode === "Range" ? <RangeCalendar { ...Props } /> : <SingleCalendar { ...Props } />;
