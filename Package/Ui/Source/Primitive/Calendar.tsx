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
 * @module @noteferry/ui/Primitive/Calendar
 *
 * @file      Calendar.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { type DateData, Calendar as RNCalendar, LocaleConfig } from "react-native-calendars";
import { MakeStyles, ViewStyle as MakeViewStyle, TextStyle } from "../MakeStyles.js";
import { Mix, WithAlpha } from "../Utility/index.js";
import {
    type PressableStateCallbackType,
    type StyleProp,
    Text,
    View,
    type ViewStyle
} from "react-native";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { format } from "date-fns/format";
import { isBefore } from "date-fns/isBefore";
import { Body } from "./Text.js";
import { Pressable } from "./Pressable.js";
import type { ReadonlyRecord } from "effect/Record";
import { useToken } from "../ThemeProvider.js";

/**
 * `react-native-calendars` doesn't export its `Theme` type from the package root; derived from
 * the component's own props instead of a deep `src/types` import.
 */
type RnCalendarTheme = NonNullable<React.ComponentProps<typeof RNCalendar>[ "theme" ]>;

const ToDateKey = (Value: Date): string => format(Value, "yyyy-MM-dd");
const ToMonthKey = (Value: Date): string => format(Value, "yyyy-MM");

interface CalendarThemeColors
{
    readonly Theme: RnCalendarTheme;
    readonly PrimaryColor: string;
    readonly MutedColor: string;
    readonly BlueColor: string;
}

/** Visual treatment used by the compact mobile date-property sheet. */
export type CalendarAppearance = "Default" | "DateSheet";

const DefaultWeekdayLabels = [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ] as const;

/**
 * Month/weekday names for `react-native-calendars`' own locale system (its
 * default, non-custom header reads from this). `DateSheetCalendarHeader`'s
 * "MMM yyyy" month token resolves through the same underlying table, but its
 * weekday row is rendered independently — see `WeekdayLabels` below.
 *
 * @category Localization
 * @since 1.0.0
 */
export interface CalendarLocaleNames
{
    readonly MonthNames: ReadonlyArray<string>;
    readonly MonthNamesShort: ReadonlyArray<string>;
    readonly DayNames: ReadonlyArray<string>;
    readonly DayNamesShort: ReadonlyArray<string>;
}

/**
 * Registers `Names` under `Code` and makes it the active locale for every
 * `Calendar` on screen. Call once per supported locale at startup, then
 * again (or just re-set the active `Code`) whenever the app's language
 * changes.
 *
 * @category Localization
 * @since 1.0.0
 */
export const RegisterCalendarLocale = (Code: string, Names: CalendarLocaleNames): void =>
{
    LocaleConfig.locales[ Code ] = {
        dayNames: [ ...Names.DayNames ],
        dayNamesShort: [ ...Names.DayNamesShort ],
        monthNames: [ ...Names.MonthNames ],
        monthNamesShort: [ ...Names.MonthNamesShort ]
    };
    LocaleConfig.defaultLocale = Code;
};

interface DateSheetCalendarHeaderProps
{
    readonly addMonth?: ((Amount: number) => void) | undefined;
    readonly month?: { readonly toString: (Format: string) => string; } | undefined;
    readonly WeekdayLabels?: ReadonlyArray<string> | undefined;
    readonly PreviousMonthLabel?: string | undefined;
    readonly NextMonthLabel?: string | undefined;
}

/** Notion-mobile month header: label on the left, adjacent arrows on the right. */
const DateSheetCalendarHeader = ({
    addMonth,
    month,
    WeekdayLabels = DefaultWeekdayLabels,
    PreviousMonthLabel = "Previous month",
    NextMonthLabel = "Next month"
}: DateSheetCalendarHeaderProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const {
        [Semantic.SidebarPrimary]: IconColor,
        [Semantic.Muted]: MutedColor
    } = useToken(Semantic.SidebarPrimary, Semantic.Muted);

    const MonthButtonStyle = ({
        pressed
    }: PressableStateCallbackType): StyleProp<ViewStyle> => [
        Styles.DateSheetMonthButton,
        pressed && Styles.DateSheetMonthButtonPressed
    ];

    return (
        <View>
            <View style={ Styles.DateSheetMonthHeader }>
                <Body Weight="600">
                    { month?.toString("MMM yyyy") ?? "" }
                </Body>
                <View style={ Styles.DateSheetMonthActions }>
                    <Pressable
                        Accessibility={ {
                            Label: PreviousMonthLabel,
                            Role: "button"
                        } }
                        OnPress={ () => addMonth?.(-1) }
                        hitSlop={ 8 }
                        style={ MonthButtonStyle }>
                        <ChevronLeft
                            color={ IconColor }
                            size={ 19 }
                        />
                    </Pressable>
                    <Pressable
                        Accessibility={ {
                            Label: NextMonthLabel,
                            Role: "button"
                        } }
                        OnPress={ () => addMonth?.(1) }
                        hitSlop={ 8 }
                        style={ MonthButtonStyle }>
                        <ChevronRight
                            color={ IconColor }
                            size={ 19 }
                        />
                    </Pressable>
                </View>
            </View>
            <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={ Styles.DateSheetWeekdays }>
                { WeekdayLabels.map((Label: string, Index: number) => (
                    <Body
                        Color={ MutedColor }
                        Style={ Styles.DateSheetWeekday }
                        key={ `${ Index }-${ Label }` }>
                        { Label }
                    </Body>
                )) }
            </View>
        </View>
    );
};

/**
 * Binds `Labels` into a `customHeader`-compatible component. `react-native-calendars`
 * passes only `{ addMonth, month }` to `customHeader` itself, so any caller-supplied
 * labels have to be captured by closure rather than passed as extra props.
 */
const MakeDateSheetCalendarHeader = (
    Labels: Pick<DateSheetCalendarHeaderProps, "NextMonthLabel" | "PreviousMonthLabel" | "WeekdayLabels">
) =>
    (Props: DateSheetCalendarHeaderProps): React.JSX.Element => (
        <DateSheetCalendarHeader
            { ...Props }
            { ...Labels }
        />
    );

interface DateSheetCalendarDayMarking
{
    readonly color?: string | undefined;
    readonly disabled?: boolean | undefined;
    readonly disableTouchEvent?: boolean | undefined;
    readonly endingDay?: boolean | undefined;
    readonly endpoint?: "Focused" | "Unfocused" | undefined;
    readonly inactive?: boolean | undefined;
    readonly selected?: boolean | undefined;
    readonly startingDay?: boolean | undefined;
    readonly textColor?: string | undefined;
}

interface DateSheetCalendarDayProps extends React.PropsWithChildren
{
    readonly accessibilityLabel?: string | undefined;
    readonly date?: DateData | undefined;
    readonly marking?: DateSheetCalendarDayMarking | undefined;
    readonly onPress?: ((Date: DateData | undefined) => void) | undefined;
    readonly state?: "" | "disabled" | "inactive" | "selected" | "today" | undefined;
    readonly testID?: string | undefined;
}

/**
 * Date-sheet day cell with a press-in selection preview. The calendar library's
 * stock cells only apply their selected style after `onPress`; using the
 * `Pressable` render state makes the rounded square visible as soon as the
 * finger goes down, while still committing the date only after a completed tap.
 */
const DateSheetCalendarDay = ({
    accessibilityLabel,
    children,
    date,
    marking,
    onPress,
    state,
    testID
}: DateSheetCalendarDayProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const {
        [ Semantic.BackgroundModal ]: CardBackground,
        [ Semantic.BlueHover ]: SelectedColor,
        [ Semantic.Muted ]: MutedColor,
        [ Semantic.Primary ]: PrimaryColor,
        [ Semantic.Red ]: RedColor
    } = useToken(
        Semantic.BackgroundModal,
        Semantic.BlueHover,
        Semantic.Muted,
        Semantic.Primary,
        Semantic.Red
    );
    const RangeBandColor = React.useMemo(() => WithAlpha(SelectedColor, 0.16), [ SelectedColor ]);
    const UnfocusedEndpointColor = React.useMemo(
        () => Mix(CardBackground, SelectedColor, 0.3),
        [ CardBackground, SelectedColor ]
    );
    const IsDisabled = marking?.disabled ?? state === "disabled";
    const IsInactive = marking?.inactive ?? state === "inactive";
    const IsToday = state === "today";
    const IsRangeStart = marking?.startingDay === true;
    const IsRangeEnd = marking?.endingDay === true;
    const IsSelected = marking?.selected === true || IsRangeStart || IsRangeEnd;
    const HasRange = marking?.color !== undefined
        && (IsRangeStart || IsRangeEnd || !marking.selected);
    const IsSingleDayRange = IsRangeStart && IsRangeEnd;
    const IsTouchDisabled = marking?.disableTouchEvent === true || IsDisabled;

    return (
        <View style={ Styles.DateSheetDayCell }>
            { HasRange && !IsSingleDayRange && (
                <View
                    pointerEvents="none"
                    style={ [
                        Styles.DateSheetRangeBand,
                        { backgroundColor: RangeBandColor },
                        IsRangeStart && Styles.DateSheetRangeBandStart,
                        IsRangeEnd && Styles.DateSheetRangeBandEnd
                    ] }
                />
            ) }
            <Pressable
                Accessibility={ {
                    Label: accessibilityLabel,
                    Role: IsDisabled ? undefined : "button"
                } }
                Disabled={ IsTouchDisabled }
                OnPress={ () => onPress?.(date) }
                style={ Styles.DateSheetDayPressable }
                testID={ testID }>
                { ({ pressed }: PressableStateCallbackType) =>
                {
                    const ShowSelected = pressed || IsSelected;
                    const ShowToday = IsToday && !ShowSelected;
                    const IsOutlinedEndpoint = ShowSelected
                        && marking?.endpoint === "Unfocused"
                        && !pressed;
                    const ShowSolid = ShowSelected && !IsOutlinedEndpoint;
                    const TextColor = ShowSolid || ShowToday
                        ? "#FFFFFF"
                        : IsDisabled || IsInactive
                            ? MutedColor
                            : marking?.textColor ?? PrimaryColor;

                    return (
                        <View
                            pointerEvents="none"
                            style={ Styles.DateSheetDayIndicator }>
                            { (ShowToday || ShowSelected) && (
                                <View style={ [
                                    Styles.DateSheetDayBackground,
                                    ShowToday && {
                                        backgroundColor: RedColor
                                    },
                                    ShowToday && Styles.DateSheetTodayBackground,
                                    IsOutlinedEndpoint && {
                                        backgroundColor: UnfocusedEndpointColor,
                                        borderColor: SelectedColor,
                                        borderRadius: 7,
                                        borderWidth: 2
                                    },
                                    ShowSolid && {
                                        backgroundColor: SelectedColor,
                                        borderRadius: 7
                                    }
                                ] } />
                            ) }
                            <Text style={ [ Styles.DateSheetDayText, { color: TextColor } ] }>
                                { children }
                            </Text>
                        </View>
                    );
                } }
            </Pressable>
        </View>
    );
};

/**
 * An endpoint when specifying a tuple of dates or times.
 *
 * @category Calendar
 * @since 1.0.0
 */
export type Endpoint =
    | "Start"
    | "End";

/**
 * Shared theme-color resolution for `SingleCalendar`/`RangeCalendar`, so the two
 * don't duplicate the `Semantic` → `RnCalendarTheme` mapping.
 */
const useCalendarTheme = (Appearance: CalendarAppearance): CalendarThemeColors =>
{
    const {
        [ Semantic.Primary ]: PrimaryColor,
        [ Semantic.Muted ]: MutedColor,
        [ Semantic.Red ]: RedColor,
        [ Semantic.Blue ]: BlueColor,
        [ Semantic.BlueHover ]: BlueHoverColor
    } = useToken(
        Semantic.Primary,
        Semantic.Muted,
        Semantic.Red,
        Semantic.Blue,
        Semantic.BlueHover
    );
    const SelectedDayColor = Appearance === "DateSheet" ? BlueHoverColor : BlueColor;

    const Theme = React.useMemo<RnCalendarTheme>(() => ({
        arrowColor: PrimaryColor,
        calendarBackground: "transparent",
        dayTextColor: PrimaryColor,
        monthTextColor: PrimaryColor,
        selectedDayBackgroundColor: SelectedDayColor,
        selectedDayTextColor: "#FFFFFF",
        textDisabledColor: MutedColor,
        textInactiveColor: MutedColor,
        textSectionTitleColor: MutedColor,
        todayBackgroundColor: Appearance === "DateSheet" ? RedColor : "transparent",
        todayTextColor: Appearance === "DateSheet" ? "#FFFFFF" : BlueColor,

        textDayFontFamily: "Roboto Flex",
        textDayHeaderFontFamily: "Roboto Flex",
        textMonthFontFamily: "Roboto Flex",
        todayButtonFontFamily: "Roboto Flex",
        ...(Appearance === "DateSheet"
            ? {
                "stylesheet.day.basic":
                {
                    base:
                    {
                        alignItems: "center",
                        height: 36,
                        justifyContent: "center",
                        width: 36
                    },
                    selected:
                    {
                        backgroundColor: SelectedDayColor,
                        borderRadius: 7
                    },
                    today:
                    {
                        borderRadius: 18
                    }
                },
                "stylesheet.day.period":
                {
                    base:
                    {
                        alignItems: "center",
                        height: 36,
                        justifyContent: "center",
                        width: 36
                    },
                    selectedText:
                    {
                        color: "#FFFFFF"
                    }
                },
                textDayFontSize: 16,
                textDayStyle:
                {
                    marginTop: 0
                },
                weekVerticalMargin: 4
            }
            : { })
    }), [ Appearance, PrimaryColor, MutedColor, RedColor, BlueColor, SelectedDayColor ]);

    return { BlueColor: SelectedDayColor, MutedColor, PrimaryColor, Theme } as const;
};

/**
 * A start/end date pair for `Calendar`'s `Mode="Range"`. Either end may be
 * `undefined` while a selection is in progress (e.g. `Start` chosen, `End`
 * not yet tapped).
 *
 * @category Input
 * @since 1.0.0
 */
export interface CalendarRange extends Partial<ReadonlyRecord<Endpoint, Date | undefined>> { }

interface CalendarCommonProps
{
    readonly Appearance?: CalendarAppearance | undefined;
    readonly MinDate?: Date | undefined;
    readonly MaxDate?: Date | undefined;
    readonly Style?: StyleProp<ViewStyle> | undefined;

    /** Only used by the `"DateSheet"` appearance's custom header. */
    readonly WeekdayLabels?: ReadonlyArray<string> | undefined;
    readonly PreviousMonthLabel?: string | undefined;
    readonly NextMonthLabel?: string | undefined;
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
    readonly ActiveEndpoint?: Endpoint | undefined;

    readonly DefaultActiveEndpoint?: Endpoint | undefined;

    readonly OnActiveEndpointChange?: ((Endpoint: Endpoint) => void) | undefined;
}

/** {@inheritDoc Calendar} */
export type CalendarProps =
    | CalendarSingleProps
    | CalendarRangeProps;

const SingleCalendar = ({
    Appearance = "Default",
    Value,
    DefaultValue,
    OnValueChange,
    MinDate,
    MaxDate,
    Style,
    WeekdayLabels,
    PreviousMonthLabel,
    NextMonthLabel
}: CalendarSingleProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState(DefaultValue);
    const CurrentValue = Value ?? UncontrolledValue;

    const { Theme } = useCalendarTheme(Appearance);

    const MarkedDates = React.useMemo(() => CurrentValue === undefined
        ? { }
        : { [ ToDateKey(CurrentValue) ]: { selected: true } },
    [ CurrentValue ]);
    const CalendarKey = CurrentValue === undefined
        ? "single-current-month"
        : `single-${ ToMonthKey(CurrentValue) }`;

    const HandleDayPress = React.useCallback((Day: DateData) =>
    {
        const NextValue = new Date(Day.year, Day.month - 1, Day.day);
        SetUncontrolledValue(NextValue);
        OnValueChange?.(NextValue);
    }, [ OnValueChange ]);

    return (
        <RNCalendar
            key={ CalendarKey }
            { ...(CurrentValue === undefined ? { } : { current: ToDateKey(CurrentValue) }) }
            { ...(MinDate === undefined ? { } : { minDate: ToDateKey(MinDate) }) }
            { ...(MaxDate === undefined ? { } : { maxDate: ToDateKey(MaxDate) }) }
            enableSwipeMonths
            { ...(Appearance === "DateSheet"
                ? {
                    customHeader: MakeDateSheetCalendarHeader({
                        NextMonthLabel,
                        PreviousMonthLabel,
                        WeekdayLabels
                    }),
                    dayComponent: DateSheetCalendarDay
                }
                : { }) }
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
    readonly customContainerStyle?: ViewStyle;
    readonly textColor: string;
    readonly startingDay: boolean;
    readonly endingDay: boolean;
    readonly endpoint?: "Focused" | "Unfocused" | undefined;
}

const DateSheetSelectedDayStyle: ViewStyle =
    {
        borderRadius: 7,
        height: 36,
        justifyContent: "center",
        paddingTop: 0,
        width: 36
    };

/**
 * One `markedDates` entry per day spanned by `Range`. The two endpoints get
 * `BlueColor` (solid, matching `SingleCalendar`'s selected-day color); days
 * strictly between them get the lighter `BandColor` — `PeriodDay` (from
 * `react-native-calendars`) renders `startingDay`/`endingDay` as rounded
 * caps and everything else as a flat, edge-to-edge band. `DateSheet`
 * endpoints receive the same softly rounded square used by single dates.
 *
 * For the `DateSheet` appearance each endpoint is additionally tagged
 * `endpoint: "Focused" | "Unfocused"` from `ActiveEndpoint`, so the day cell
 * can render the focused endpoint as a solid box and the other as a lighter
 * outlined box (Notion's range style). Tagging is skipped for the default
 * appearance, whose stock `PeriodDay` keeps both endpoints solid.
 */
const BuildRangeMarkedDates = (
    Range: CalendarRange,
    BlueColor: string,
    BandColor: string,
    PrimaryColor: string,
    SelectedDayStyle: ViewStyle | undefined,
    ActiveEndpoint: Endpoint | undefined
): Record<string, RangeMarking> =>
{
    const IsDateSheet = SelectedDayStyle !== undefined;
    const FocusedDate = IsDateSheet && ActiveEndpoint !== undefined
        ? Range[ ActiveEndpoint ]
        : undefined;
    const FocusedKey = FocusedDate === undefined ? undefined : ToDateKey(FocusedDate);

    if (Range.Start === undefined)
    {
        return { };
    }

    if (Range.End === undefined)
    {
        return {
            [ ToDateKey(Range.Start) ]:
                {
                    color: BlueColor,
                    ...(SelectedDayStyle === undefined
                        ? { }
                        : { customContainerStyle: SelectedDayStyle }),
                    ...(IsDateSheet ? { endpoint: "Focused" as const } : { }),
                    endingDay: true,
                    startingDay: true,
                    textColor: "#FFFFFF"
                }
        };
    }

    const [ Lo, Hi ] = isBefore(Range.End, Range.Start)
        ? [ Range.End, Range.Start ]
        : [ Range.Start, Range.End ];
    const Days = eachDayOfInterval({ end: Hi, start: Lo });

    return Object.fromEntries(Days.map((Day: Date, Index: number) =>
    {
        const IsEndpoint = Index === 0 || Index === Days.length - 1;
        const IsFocusedEndpoint = FocusedKey === undefined || ToDateKey(Day) === FocusedKey;

        return [ ToDateKey(Day), {
            color: IsEndpoint ? BlueColor : BandColor,
            ...(IsEndpoint && SelectedDayStyle !== undefined
                ? { customContainerStyle: SelectedDayStyle }
                : { }),
            ...(IsDateSheet && IsEndpoint
                ? { endpoint: IsFocusedEndpoint ? "Focused" as const : "Unfocused" as const }
                : { }),
            endingDay: Index === Days.length - 1,
            startingDay: Index === 0,
            textColor: IsEndpoint
                ? (IsDateSheet && !IsFocusedEndpoint ? PrimaryColor : "#FFFFFF")
                : PrimaryColor
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
    readonly NextActiveEndpoint?: Endpoint;
}

/**
 * Writes straight into whichever endpoint `ActiveEndpoint` currently names.
 * This is used whenever the caller (e.g. `DateSheet`) drives endpoint targeting itself.
 */
const ResolveTargetedRange = (
    Current: CalendarRange,
    Tapped: Date,
    ActiveEndpoint: Endpoint
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
    Appearance = "Default",
    Value,
    DefaultValue,
    OnValueChange,
    ActiveEndpoint,
    DefaultActiveEndpoint,
    OnActiveEndpointChange,
    MinDate,
    MaxDate,
    Style,
    WeekdayLabels,
    PreviousMonthLabel,
    NextMonthLabel
}: CalendarRangeProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState<CalendarRange>(DefaultValue ?? { });
    const CurrentValue = Value ?? UncontrolledValue;

    const [ UncontrolledActiveEndpoint, SetUncontrolledActiveEndpoint ] =
        React.useState<Endpoint | undefined>(DefaultActiveEndpoint);
    const IsEndpointTargeted = ActiveEndpoint !== undefined
        || DefaultActiveEndpoint !== undefined
        || OnActiveEndpointChange !== undefined;
    const CurrentActiveEndpoint = ActiveEndpoint ?? UncontrolledActiveEndpoint;

    const { BlueColor, PrimaryColor, Theme } = useCalendarTheme(Appearance);
    const BandColor = React.useMemo(() => WithAlpha(BlueColor, 0.16), [ BlueColor ]);

    const MarkedDates = React.useMemo(
        () => BuildRangeMarkedDates(
            CurrentValue,
            BlueColor,
            BandColor,
            PrimaryColor,
            Appearance === "DateSheet" ? DateSheetSelectedDayStyle : undefined,
            CurrentActiveEndpoint
        ),
        [ CurrentValue, BlueColor, BandColor, PrimaryColor, Appearance, CurrentActiveEndpoint ]
    );
    const DisplayedValue = CurrentActiveEndpoint === "End"
        ? CurrentValue.End ?? CurrentValue.Start
        : CurrentValue.Start ?? CurrentValue.End;
    const CalendarKey = DisplayedValue === undefined
        ? "range-current-month"
        : `range-${ ToMonthKey(DisplayedValue) }`;

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
            key={ CalendarKey }
            { ...(DisplayedValue === undefined ? {} : { current: ToDateKey(DisplayedValue) }) }
            { ...(MinDate === undefined ? {} : { minDate: ToDateKey(MinDate) }) }
            { ...(MaxDate === undefined ? {} : { maxDate: ToDateKey(MaxDate) }) }
            enableSwipeMonths
            { ...(Appearance === "DateSheet"
                ? {
                    customHeader: MakeDateSheetCalendarHeader({
                        NextMonthLabel,
                        PreviousMonthLabel,
                        WeekdayLabels
                    }),
                    dayComponent: DateSheetCalendarDay
                }
                : { }) }
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

const useStyles = MakeStyles({
    DateSheetDayBackground: MakeViewStyle({
        height: 36,
        left: "50%",
        marginLeft: -18,
        marginTop: -18,
        position: "absolute",
        top: "50%",
        width: 36
    }),
    DateSheetDayCell: MakeViewStyle({
        alignItems: "center",
        height: 36,
        justifyContent: "center",
        width: "100%"
    }),
    DateSheetDayIndicator: MakeViewStyle({
        alignItems: "center",
        height: 36,
        justifyContent: "center",
        width: 36
    }),
    DateSheetDayPressable: MakeViewStyle({
        alignItems: "center",
        height: 36,
        justifyContent: "center",
        width: "100%"
    }),
    DateSheetDayText: TextStyle({
        fontFamily: "Roboto Flex",
        fontSize: 16
    }),
    DateSheetMonthActions: MakeViewStyle({
        flexDirection: "row",
        gap: 0,
        paddingRight: 5
    }),
    DateSheetMonthButton: MakeViewStyle({
        alignItems: "center",
        borderRadius: 6,
        height: 32,
        justifyContent: "center",
        width: 32
    }),
    DateSheetMonthButtonPressed: MakeViewStyle({
        backgroundColor: "rgba(55, 53, 47, 0.08)"
    }),
    DateSheetMonthHeader: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 18,
        paddingRight: 0,
        paddingTop: 10
    }),
    DateSheetRangeBand: MakeViewStyle({
        height: 36,
        left: 0,
        position: "absolute",
        right: 0
    }),
    DateSheetRangeBandEnd: MakeViewStyle({
        left: 0,
        right: "50%"
    }),
    DateSheetRangeBandStart: MakeViewStyle({
        left: "50%",
        right: 0
    }),
    DateSheetTodayBackground: MakeViewStyle({
        borderRadius: 16,
        height: 32,
        marginLeft: -16,
        marginTop: -16,
        width: 32
    }),
    DateSheetWeekday: TextStyle({
        fontSize: 16,
        textAlign: "center",
        width: 32
    }),
    DateSheetWeekdays: MakeViewStyle({
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 4,
        marginTop: 5,
        paddingHorizontal: 5
    })
});
