/**
 * Windows variant of `DateSheet.tsx`. Not a port of the mobile bottom sheet —
 * a new component styled as a floating popover near the calendar/date-
 * property trigger, resembling Notion's desktop web app's date picker (this
 * file's structural/interaction resemblance to that layout should be
 * verified against the real Notion web app via `agent-browser` in a
 * follow-up session with that access — see the port plan's verification
 * section). Built from pieces already in this package:
 *
 * - `Popup.tsx` (already Windows-safe) instead of `BottomSheet`/`Dialog`,
 *   anchored to a caller-supplied `Anchor` ref. This is a deliberate,
 *   documented prop-shape difference from the mobile `DateSheetProps`
 *   (which take `OnDismiss`/`Ref` from `BottomSheetProps`): Windows's
 *   `DateSheetProps` take `Anchor`/`IsVisible`/`OnRequestClose` instead,
 *   matching every other anchored popup in this package (`Popover`,
 *   `DropdownMenu`, `Select`, ...).
 * - `Calendar.tsx` (unchanged, already Windows-safe) for the month grid —
 *   since it's always visible in the popover body, the date chip itself is
 *   a plain (non-interactive) label here rather than a second way to open a
 *   picker.
 * - `Menu.tsx`/`MenuItem`/`Switch`/`Separator` (unchanged, Group 1) for the
 *   End-date switch, Date-format row, Include-time switch, Time-format row,
 *   Timezone row, and Clear action — same as mobile.
 * - Time-of-day entry: no native OS time picker exists off `@expo/ui` here,
 *   so `DateSheetTimeOfDayPopup` below is a small new popup — following the
 *   exact `DateSheetOptionPopup` pattern already used for Date format/Time
 *   format/Timezone — listing half-hour time-of-day options instead of a
 *   native spinner/dialog.
 *
 * All other date-format/time-format/timezone logic (`BuildDateFormatOptions`,
 * `BuildTimezoneOptions`, `GetTimezoneAbbreviation`, `CombineDateAndTime`,
 * ...) is plain JS and ports unchanged.
 *
 * @module @noteferry/ui/Primitive/DateSheet
 *
 * @file      DateSheet.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { Body, ModalTitle } from "./Text.js";
import { Calendar, type CalendarRange } from "./Calendar.js";
import { ChevronDown, CircleQuestionMark as HelpCircle } from "../Icon.js";
import { MakeStyles, ViewStyle as MakeViewStyle, TextStyle } from "../MakeStyles.js";
import { MenuItem, MenuItemCheck, MenuItemSelect } from "./Menu.js";
import {
    type PressableStateCallbackType,
    ScrollView,
    type StyleProp,
    View,
    type ViewStyle
} from "react-native";
import { Popup, type PopupAnchor } from "./Popup.js";
import { Button } from "./Button.js";
import { Pressable } from "./Pressable.js";
import { Separator } from "./Separator.js";
import { Switch } from "./Switch.js";
import type { Thunk } from "@sorrell/effect/Function";
import { WithAlpha } from "../Utility/index.js";
import { format } from "date-fns/format";
import type { Locale } from "date-fns";
import { useToken } from "../ThemeProvider.js";

/**
 * The caller-visible date-display preference `DateSheet` surfaces via `OnDateFormatChange`.
 *
 * @category Input
 * @since 1.0.0
 */
export type DateSheetDateFormat =
    | "Full"
    | "Short"
    | "MonthDayYear"
    | "DayMonthYear"
    | "YearMonthDay"
    | "Relative";

/**
 * The caller-visible time-display preference; also drives the format of
 * `DateSheet`'s own time chip/list, since that's literally what's onscreen.
 *
 * @category Input
 * @since 1.0.0
 */
export type DateSheetTimeFormat =
    | "Hidden"
    | "TwelveHour"
    | "TwentyFourHour";

interface OptionEntry<A extends string>
{
    readonly Value: A;
    readonly Label: string;
}

/**
 * Every string `DateSheet` renders, overridable by a caller (the app layer
 * owns translation — this package stays i18n-library-agnostic). Every field
 * is optional; omitted ones fall back to {@link DefaultDateSheetLabels}, so
 * existing callers that pass no `Labels` at all keep today's English text.
 *
 * @category Input
 * @since 1.0.0
 */
export interface DateSheetLabels
{
    readonly SelectDate?: string;
    readonly SelectTime?: string;
    readonly Help?: string;
    readonly EndDate?: string;
    readonly DateFormat?: string;
    readonly DateFormatFull?: string;
    readonly DateFormatShort?: string;
    readonly DateFormatMonthDayYear?: string;
    readonly DateFormatDayMonthYear?: string;
    readonly DateFormatYearMonthDay?: string;
    readonly DateFormatRelative?: string;
    readonly IncludeTime?: string;
    readonly TimeFormat?: string;
    readonly TimeFormatHidden?: string;
    readonly TimeFormatTwelveHour?: string;
    readonly TimeFormatTwentyFourHour?: string;
    readonly Timezone?: string;
    readonly Clear?: string;
    /** Sunday-first, e.g. `["Su","Mo","Tu","We","Th","Fr","Sa"]`. */
    readonly WeekdayLabels?: ReadonlyArray<string>;
    readonly PreviousMonth?: string;
    readonly NextMonth?: string;
}

const DefaultDateSheetLabels: Required<DateSheetLabels> = {
    Clear: "Clear",
    DateFormat: "Date format",
    DateFormatDayMonthYear: "Day/Month/Year",
    DateFormatFull: "Full date",
    DateFormatMonthDayYear: "Month/Day/Year",
    DateFormatRelative: "Relative",
    DateFormatShort: "Short date",
    DateFormatYearMonthDay: "Year/Month/Day",
    EndDate: "End date",
    Help: "Help",
    IncludeTime: "Include time",
    NextMonth: "Next month",
    PreviousMonth: "Previous month",
    SelectDate: "Select a date",
    SelectTime: "Select a time",
    TimeFormat: "Time format",
    TimeFormatHidden: "Hidden",
    TimeFormatTwelveHour: "12 hour",
    TimeFormatTwentyFourHour: "24 hour",
    Timezone: "Timezone",
    WeekdayLabels: [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ]
};

const BuildDateFormatOptions = (L: Required<DateSheetLabels>): ReadonlyArray<OptionEntry<DateSheetDateFormat>> =>
    [
        { Label: L.DateFormatFull, Value: "Full" },
        { Label: L.DateFormatShort, Value: "Short" },
        { Label: L.DateFormatMonthDayYear, Value: "MonthDayYear" },
        { Label: L.DateFormatDayMonthYear, Value: "DayMonthYear" },
        { Label: L.DateFormatYearMonthDay, Value: "YearMonthDay" },
        { Label: L.DateFormatRelative, Value: "Relative" }
    ];

const BuildTimeFormatOptions = (L: Required<DateSheetLabels>): ReadonlyArray<OptionEntry<DateSheetTimeFormat>> =>
    [
        { Label: L.TimeFormatHidden, Value: "Hidden" },
        { Label: L.TimeFormatTwelveHour, Value: "TwelveHour" },
        { Label: L.TimeFormatTwentyFourHour, Value: "TwentyFourHour" }
    ];

const FallbackTimezones: ReadonlyArray<string> =
    [
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "America/Anchorage",
        "Pacific/Honolulu",
        "UTC"
    ];

const GetDeviceTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Device zone first, then every other supported zone (or `FallbackTimezones` if unsupported). */
const BuildTimezoneOptions = (DeviceZone: string): ReadonlyArray<OptionEntry<string>> =>
{
    let AllZones: ReadonlyArray<string>;

    try
    {
        AllZones = Intl.supportedValuesOf("timeZone");
    }
    catch
    {
        AllZones = FallbackTimezones;
    }

    const Ordered = [ DeviceZone, ...AllZones.filter((Zone: string) => Zone !== DeviceZone) ];

    return Ordered.map((Zone: string) => ({ Label: Zone.replace(/_/g, " "), Value: Zone }));
};

const GetTimezoneAbbreviation = (Zone: string, Reference: Date): string =>
{
    try
    {
        const Parts = Intl.DateTimeFormat("en-US", { timeZone: Zone, timeZoneName: "short" })
            .formatToParts(Reference);

        return Parts.find((Part: Intl.DateTimeFormatPart) => Part.type === "timeZoneName")?.value ?? Zone;
    }
    catch
    {
        return Zone;
    }
};

const GetTimeFormatPattern = (Format: DateSheetTimeFormat): string =>
    Format === "TwentyFourHour" ? "HH:mm" : "h:mm aa";

/** Half-hour time-of-day options for `DateSheetTimeOfDayPopup`, keyed `"HH:mm"` (24-hour, unambiguous). */
const BuildTimeOfDayOptions = (
    TimeFormat: DateSheetTimeFormat,
    Locale: Locale | undefined
): ReadonlyArray<OptionEntry<string>> =>
{
    const Pattern = GetTimeFormatPattern(TimeFormat);
    const Options: Array<OptionEntry<string>> = [ ];

    for (let Hour = 0; Hour < 24; Hour += 1)
    {
        for (const Minute of [ 0, 30 ])
        {
            const Reference = new Date(2000, 0, 1, Hour, Minute);
            const Value = `${ String(Hour).padStart(2, "0") }:${ String(Minute).padStart(2, "0") }`;
            Options.push({
                Label: format(Reference, Pattern, Locale === undefined ? { } : { locale: Locale }),
                Value
            });
        }
    }

    return Options;
};

/** Keeps `Previous`'s hour/minute (defaulting to 9:00 AM) when a new calendar day is tapped. */
const CombineDateAndTime = (Day: Date, Previous: Date | undefined): Date =>
{
    const Result = new Date(Day);
    Result.setHours(Previous?.getHours() ?? 9, Previous?.getMinutes() ?? 0, 0, 0);
    return Result;
};

/** Applies a `"HH:mm"` time-of-day key (from `BuildTimeOfDayOptions`) onto `Previous`'s calendar day. */
const ApplyTimeOfDay = (TimeKey: string, Previous: Date | undefined): Date =>
{
    const [ HourText, MinuteText ] = TimeKey.split(":");
    const Result = new Date(Previous ?? new Date());
    Result.setHours(Number(HourText), Number(MinuteText), 0, 0);
    return Result;
};

/** Deliberately independent of `DateFormat` — see the file header comment. */
const FormatChipDate = (Value: Date | undefined, SelectDateLabel: string, Locale: Locale | undefined): string =>
    Value === undefined
        ? SelectDateLabel
        : format(Value, "MM/dd/yyyy", Locale === undefined ? { } : { locale: Locale });

/**
 * The `Value`/`DefaultValue`/`OnValueChange` controlled/uncontrolled triple
 * used throughout this package (`Calendar`, `Select`, `Autocomplete`,
 * `Switch`), factored out here since `DateSheet` needs eight of them.
 */
const useControllable = <A,>(
    Value: A | undefined,
    DefaultValue: A | undefined,
    OnChange: ((Value: A) => void) | undefined
): readonly [ A | undefined, (NextValue: A) => void ] =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState(DefaultValue);
    const CurrentValue = Value ?? UncontrolledValue;

    const SetValue = React.useCallback((NextValue: A) =>
    {
        SetUncontrolledValue(NextValue);
        OnChange?.(NextValue);
    }, [ OnChange ]);

    return [ CurrentValue, SetValue ] as const;
};

interface DateSheetChipSegmentProps
{
    readonly Label: string;
    readonly OnPress?: Thunk;
    readonly ShowChevron?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

const DateSheetChipSegment = React.forwardRef<
    React.ComponentRef<typeof Pressable>,
    DateSheetChipSegmentProps
>(({
    Label,
    OnPress,
    ShowChevron = true,
    Style
}: DateSheetChipSegmentProps, ForwardedRef: React.ForwardedRef<View>) =>
{
    const Styles = useStyles();
    const { [Semantic.Muted]: MutedColor } = useToken(Semantic.Muted);

    return (
        <Pressable
            Accessibility={ {
                Label,
                Role: OnPress === undefined ? undefined : "button"
            } }
            OnPress={ OnPress }
            ref={ ForwardedRef }
            style={ ({ pressed }: PressableStateCallbackType) => [
                Styles.ChipSegment,
                Style,
                pressed && OnPress !== undefined && Styles.ChipSegmentPressed
            ] }>
            <Body
                NumberOfLines={ 1 }
                Style={ Styles.ChipSegmentLabel }>
                { Label }
            </Body>
            { ShowChevron && OnPress !== undefined && (
                <ChevronDown
                    color={ MutedColor }
                    size={ 14 }
                />
            ) }
        </Pressable>
    );
});

DateSheetChipSegment.displayName = "DateSheetChipSegment";

interface DateSheetChipProps extends React.PropsWithChildren
{
    readonly Highlighted: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

const DateSheetChip = ({ Highlighted, Style, children }: DateSheetChipProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const {
        [Semantic.BackgroundInput]: InputBackgroundColor,
        [Semantic.Ring]: RingColor,
        [Semantic.Blue]: BlueColor,
        [Radii.Medium]: MediumRadius
    } = useToken(
        Semantic.BackgroundInput,
        Semantic.Ring,
        Semantic.Blue,
        Radii.Medium
    );

    return (
        <View style={ [
            Styles.Chip,
            {
                backgroundColor: Highlighted
                    ? WithAlpha(BlueColor, 0.12)
                    : InputBackgroundColor,
                borderColor: Highlighted ? BlueColor : RingColor,
                borderRadius: MediumRadius,
                borderWidth: Highlighted ? 2 : 1
            },
            Style
        ] }>
            { children }
        </View>
    );
};

interface OptionPopupProps<A extends string>
{
    readonly Anchor: PopupAnchor;
    readonly IsVisible: boolean;
    readonly OnRequestClose: Thunk;
    readonly Options: ReadonlyArray<OptionEntry<A>>;
    readonly Value: A;
    readonly OnValueChange: (Value: A) => void;
}

/** The one generic building block backing the "Date format"/"Time format"/"Timezone"/time-of-day rows. */
const DateSheetOptionPopup = <A extends string,>({
    Anchor,
    IsVisible,
    OnRequestClose,
    Options,
    Value,
    OnValueChange
}: OptionPopupProps<A>): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <Popup
            Anchor={ Anchor }
            IsVisible={ IsVisible }
            OnRequestClose={ OnRequestClose }
            Placement="Bottom"
            Style={ { minWidth: 180 } }>
            <ScrollView
                contentContainerStyle={ Styles.PopupList }
                style={ Styles.PopupScroll }>
                { Options.map((Option: OptionEntry<A>) => (
                    <MenuItem
                        Label={ Option.Label }
                        OnPress={ () =>
                        {
                            OnValueChange(Option.Value);
                            OnRequestClose();
                        } }
                        key={ Option.Value }>
                        { Option.Value === Value && <MenuItemCheck /> }
                    </MenuItem>
                )) }
            </ScrollView>
        </Popup>
    );
};

interface DateSheetSwitchRowProps
{
    readonly Label: string;
    readonly Value: boolean;
    readonly OnValueChange: (Value: boolean) => void;
}

const DateSheetSwitchRow = ({ Label, Value, OnValueChange }: DateSheetSwitchRowProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View style={ Styles.SwitchRow }>
            <Body>{ Label }</Body>
            <Switch
                { ...{ OnValueChange, Value } }
                Size="Medium"
            />
        </View>
    );
};

interface DateSheetFieldRowProps
{
    readonly Value: Date | undefined;
    readonly EndValue: Date | undefined;
    readonly ShowEndDate: boolean;
    readonly IncludeTime: boolean;
    readonly ActiveField: "Start" | "End";
    readonly TimeFormat: DateSheetTimeFormat;
    readonly OnOpenTimePopup: (Field: "Start" | "End") => void;
    readonly StartTimeAnchorRef: PopupAnchor;
    readonly EndTimeAnchorRef: PopupAnchor;
    readonly Labels: Required<DateSheetLabels>;
    readonly Locale: Locale | undefined;
}

const DateSheetFieldRow = ({
    Value,
    EndValue,
    ShowEndDate,
    IncludeTime,
    ActiveField,
    TimeFormat,
    OnOpenTimePopup,
    StartTimeAnchorRef,
    EndTimeAnchorRef,
    Labels,
    Locale
}: DateSheetFieldRowProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const TimePattern = GetTimeFormatPattern(TimeFormat);
    const FormatTimeLabel = (Reference: Date | undefined): string =>
        format(
            Reference ?? new Date(2000, 0, 1, 9, 0),
            TimePattern,
            Locale === undefined ? { } : { locale: Locale }
        );

    return (
        <View style={ [
            Styles.FieldRow,
            ShowEndDate && Styles.FieldRowWithEnd
        ] }>
            <DateSheetChip
                Highlighted={ ActiveField === "Start" && Value !== undefined }
                Style={ ShowEndDate ? Styles.ChipFull : Styles.ChipFlex }>
                <DateSheetChipSegment
                    Label={ FormatChipDate(Value, Labels.SelectDate, Locale) }
                    ShowChevron={ false }
                    Style={ Styles.DateSegment }
                />
                { IncludeTime && (
                    <>
                        <Separator
                            Orientation="Vertical"
                            Style={ Styles.ChipDivider }
                        />
                        <DateSheetChipSegment
                            Label={ FormatTimeLabel(Value) }
                            OnPress={ () => OnOpenTimePopup("Start") }
                            Style={ Styles.TimeSegment }
                            ref={ StartTimeAnchorRef }
                        />
                    </>
                ) }
            </DateSheetChip>
            { ShowEndDate
                && <DateSheetChip
                    Highlighted={ ActiveField === "End" && EndValue !== undefined }
                    Style={ Styles.ChipFull }>
                    <DateSheetChipSegment
                        Label={ FormatChipDate(EndValue, Labels.SelectDate, Locale) }
                        ShowChevron={ false }
                        Style={ Styles.DateSegment }
                    />
                    { IncludeTime && (
                        <>
                            <Separator
                                Orientation="Vertical"
                                Style={ Styles.ChipDivider }
                            />
                            <DateSheetChipSegment
                                Label={ FormatTimeLabel(EndValue) }
                                OnPress={ () => OnOpenTimePopup("End") }
                                Style={ Styles.TimeSegment }
                                ref={ EndTimeAnchorRef }
                            />
                        </>
                    ) }
                </DateSheetChip> }
        </View>
    );
};

/** {@inheritDoc DateSheet} */
export interface DateSheetProps
{
    /** The element the popover is anchored to — e.g. the date property's own trigger row. */
    readonly Anchor: PopupAnchor;
    readonly IsVisible: boolean;
    readonly OnRequestClose: Thunk;

    /** Start date (carries time-of-day too, once `IncludeTime` is on). */
    readonly Value?: Date | undefined;
    readonly DefaultValue?: Date | undefined;
    readonly OnValueChange?: ((Value: Date | undefined) => void) | undefined;

    readonly ShowEndDate?: boolean | undefined;
    readonly DefaultShowEndDate?: boolean | undefined;
    readonly OnShowEndDateChange?: ((Value: boolean) => void) | undefined;
    readonly EndValue?: Date | undefined;
    readonly DefaultEndValue?: Date | undefined;
    readonly OnEndValueChange?: ((Value: Date | undefined) => void) | undefined;

    readonly IncludeTime?: boolean | undefined;
    readonly DefaultIncludeTime?: boolean | undefined;
    readonly OnIncludeTimeChange?: ((Value: boolean) => void) | undefined;

    /** Which chip the calendar acts on; only meaningful when `ShowEndDate`. */
    readonly ActiveField?: ("Start" | "End") | undefined;
    readonly DefaultActiveField?: ("Start" | "End") | undefined;
    readonly OnActiveFieldChange?: ((Value: "Start" | "End") => void) | undefined;

    readonly DateFormat?: DateSheetDateFormat | undefined;
    readonly DefaultDateFormat?: DateSheetDateFormat | undefined;
    readonly OnDateFormatChange?: ((Value: DateSheetDateFormat) => void) | undefined;
    readonly TimeFormat?: DateSheetTimeFormat | undefined;
    readonly DefaultTimeFormat?: DateSheetTimeFormat | undefined;
    readonly OnTimeFormatChange?: ((Value: DateSheetTimeFormat) => void) | undefined;
    readonly Timezone?: string | undefined;
    readonly DefaultTimezone?: string | undefined;
    readonly OnTimezoneChange?: ((Value: string) => void) | undefined;

    readonly MinDate?: Date | undefined;
    readonly MaxDate?: Date | undefined;

    /** The "?" help icon only renders when this is supplied. */
    readonly OnHelpPress?: (() => void) | undefined;
    readonly OnClear?: (() => void) | undefined;
    /** Heading displayed at the top of the popover. */
    readonly Title?: string | undefined;
    /** `date-fns` locale used to format the date/time chips — defaults to US English. */
    readonly Locale?: Locale | undefined;
    /** Overrides for every string this component renders — see {@link DateSheetLabels}. */
    readonly Labels?: DateSheetLabels | undefined;
}

export/**
       * A floating popover for editing a date property — start/end date, an
       * optional time-of-day, and the format/timezone preferences used to
       * display them, anchored near the trigger that opened it. See the file
       * header comment for exactly how this differs from the mobile bottom
       * sheet and from Notion's own web/native implementation.
       *
       * @category Component
       * @since 1.0.0
       */
const DateSheet = ({
    Anchor,
    IsVisible,
    OnRequestClose,
    Value,
    DefaultValue,
    OnValueChange,
    ShowEndDate,
    DefaultShowEndDate,
    OnShowEndDateChange,
    EndValue,
    DefaultEndValue,
    OnEndValueChange,
    IncludeTime,
    DefaultIncludeTime,
    OnIncludeTimeChange,
    ActiveField,
    DefaultActiveField,
    OnActiveFieldChange,
    DateFormat,
    DefaultDateFormat,
    OnDateFormatChange,
    TimeFormat,
    DefaultTimeFormat,
    OnTimeFormatChange,
    Timezone,
    DefaultTimezone,
    OnTimezoneChange,
    MinDate,
    MaxDate,
    OnHelpPress,
    OnClear,
    Title = "Date",
    Locale,
    Labels: LabelOverrides
}: DateSheetProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const Labels: Required<DateSheetLabels> = { ...DefaultDateSheetLabels, ...LabelOverrides };
    const DateFormatOptions = React.useMemo(() => BuildDateFormatOptions(Labels), [ Labels ]);
    const TimeFormatOptions = React.useMemo(() => BuildTimeFormatOptions(Labels), [ Labels ]);
    const [ CurrentValue, SetValue ] =
        useControllable<Date | undefined>(Value, DefaultValue, OnValueChange);
    const [ CurrentEndValue, SetEndValue ] =
        useControllable<Date | undefined>(EndValue, DefaultEndValue, OnEndValueChange);

    const [ RawShowEndDate, SetShowEndDate ] =
        useControllable(ShowEndDate, DefaultShowEndDate ?? false, OnShowEndDateChange);
    const CurrentShowEndDate = RawShowEndDate ?? false;

    const [ RawIncludeTime, SetIncludeTime ] =
        useControllable(IncludeTime, DefaultIncludeTime ?? false, OnIncludeTimeChange);
    const CurrentIncludeTime = RawIncludeTime ?? false;

    const [ RawActiveField, SetActiveField ] = useControllable<"Start" | "End">(
        ActiveField,
        DefaultActiveField ?? "Start",
        OnActiveFieldChange
    );
    const CurrentActiveField = RawActiveField ?? "Start";

    const [ RawDateFormat, SetDateFormat ] = useControllable<DateSheetDateFormat>(
        DateFormat,
        DefaultDateFormat ?? "Full",
        OnDateFormatChange
    );
    const CurrentDateFormat = RawDateFormat ?? "Full";

    const [ RawTimeFormat, SetTimeFormat ] = useControllable<DateSheetTimeFormat>(
        TimeFormat,
        DefaultTimeFormat ?? "TwelveHour",
        OnTimeFormatChange
    );
    const CurrentTimeFormat = RawTimeFormat ?? "TwelveHour";

    const DeviceTimezone = React.useMemo(GetDeviceTimezone, [ ]);
    const [ RawTimezone, SetTimezone ] =
        useControllable<string>(Timezone, DefaultTimezone ?? DeviceTimezone, OnTimezoneChange);
    const CurrentTimezone = RawTimezone ?? DeviceTimezone;
    const TimezoneOptions = React.useMemo(() => BuildTimezoneOptions(DeviceTimezone), [ DeviceTimezone ]);
    const TimeOfDayOptions = React.useMemo(
        () => BuildTimeOfDayOptions(CurrentTimeFormat, Locale),
        [ CurrentTimeFormat, Locale ]
    );

    const HandleShowEndDateChange = React.useCallback((Next: boolean) =>
    {
        SetShowEndDate(Next);

        if (!Next)
        {
            SetEndValue(undefined);
        }
        else
        {
            SetActiveField("End");
        }
    }, [ SetShowEndDate, SetEndValue, SetActiveField ]);

    const HandleRangeChange = React.useCallback((Range: CalendarRange) =>
    {
        SetValue(
            CurrentIncludeTime && Range.Start !== undefined
                ? CombineDateAndTime(Range.Start, CurrentValue)
                : Range.Start
        );
        SetEndValue(
            CurrentIncludeTime && Range.End !== undefined
                ? CombineDateAndTime(Range.End, CurrentEndValue)
                : Range.End
        );
    }, [ CurrentIncludeTime, CurrentValue, CurrentEndValue, SetValue, SetEndValue ]);

    const HandleSingleDayChange = React.useCallback((Day: Date) =>
    {
        SetValue(CurrentIncludeTime ? CombineDateAndTime(Day, CurrentValue) : Day);
    }, [ CurrentIncludeTime, CurrentValue, SetValue ]);

    const HandleClear = React.useCallback(() =>
    {
        SetValue(undefined);
        SetEndValue(undefined);
        OnClear?.();
    }, [ SetValue, SetEndValue, OnClear ]);

    const DateFormatAnchorRef: PopupAnchor = React.useRef(null);
    const [ IsDateFormatOpen, SetIsDateFormatOpen ] = React.useState(false);
    const TimeFormatAnchorRef: PopupAnchor = React.useRef(null);
    const [ IsTimeFormatOpen, SetIsTimeFormatOpen ] = React.useState(false);
    const TimezoneAnchorRef: PopupAnchor = React.useRef(null);
    const [ IsTimezoneOpen, SetIsTimezoneOpen ] = React.useState(false);
    const StartTimeAnchorRef: PopupAnchor = React.useRef(null);
    const EndTimeAnchorRef: PopupAnchor = React.useRef(null);
    const [ OpenTimePopupField, SetOpenTimePopupField ] = React.useState<"Start" | "End" | undefined>(undefined);

    const HandleOpenTimePopup = React.useCallback((Field: "Start" | "End") =>
    {
        SetActiveField(Field);
        SetOpenTimePopupField(Field);
    }, [ SetActiveField ]);

    const HandleTimeOfDayChange = React.useCallback((TimeKey: string) =>
    {
        if (OpenTimePopupField === "Start")
        {
            SetValue(ApplyTimeOfDay(TimeKey, CurrentValue));
        }
        else if (OpenTimePopupField === "End")
        {
            SetEndValue(ApplyTimeOfDay(TimeKey, CurrentEndValue));
        }
    }, [ OpenTimePopupField, CurrentValue, CurrentEndValue, SetValue, SetEndValue ]);

    const {
        [Semantic.Icon]: IconColor,
        [Semantic.BackgroundSidebar]: SheetBackground,
        [Semantic.BackgroundModal]: CardBackground,
        [Radii.Large]: LargeRadius,
        [Spacing.M]: BodyGap
    } = useToken(
        Semantic.Icon,
        Semantic.BackgroundSidebar,
        Semantic.BackgroundModal,
        Radii.Large,
        Spacing.M
    );

    const CardStyle: StyleProp<ViewStyle> =
        [
            Styles.Card,
            {
                backgroundColor: CardBackground,
                borderRadius: LargeRadius
            }
        ] as const;

    const CurrentDateFormatLabel = DateFormatOptions.find(
        (Option: OptionEntry<DateSheetDateFormat>) => Option.Value === CurrentDateFormat
    )?.Label;
    const CurrentTimeFormatLabel = TimeFormatOptions.find(
        (Option: OptionEntry<DateSheetTimeFormat>) => Option.Value === CurrentTimeFormat
    )?.Label;
    const CurrentTimeOfDayValue = OpenTimePopupField === "End"
        ? CurrentEndValue
        : CurrentValue;
    const CurrentTimeOfDayKey = CurrentTimeOfDayValue === undefined
        ? "09:00"
        : `${ String(CurrentTimeOfDayValue.getHours()).padStart(2, "0") }:`
            + `${ String(Math.floor(CurrentTimeOfDayValue.getMinutes() / 30) * 30).padStart(2, "0") }`;

    return (
        <Popup
            Anchor={ Anchor }
            IsVisible={ IsVisible }
            OnRequestClose={ OnRequestClose }
            Placement="Bottom"
            Style={ [ Styles.Popup, { backgroundColor: SheetBackground } ] }>
            <ScrollView
                contentContainerStyle={ [ Styles.ScrollContent, { gap: BodyGap } ] }
                style={ { backgroundColor: SheetBackground } }>
                <View style={ Styles.Header }>
                    <ModalTitle Style={ Styles.HeaderTitle }>
                        { Title }
                    </ModalTitle>
                    { OnHelpPress && (
                        <Button
                            AccessibilityLabel={ Labels.Help }
                            Appearance="NavIcon"
                            OnPress={ OnHelpPress }
                            Size="Circle">
                            <HelpCircle
                                color={ IconColor }
                                size={ 18 }
                            />
                        </Button>
                    ) }
                </View>
                <View style={ [ CardStyle, Styles.FieldCard ] }>
                    <DateSheetFieldRow
                        ActiveField={ CurrentActiveField }
                        EndTimeAnchorRef={ EndTimeAnchorRef }
                        EndValue={ CurrentEndValue }
                        IncludeTime={ CurrentIncludeTime }
                        Labels={ Labels }
                        Locale={ Locale }
                        OnOpenTimePopup={ HandleOpenTimePopup }
                        ShowEndDate={ CurrentShowEndDate }
                        StartTimeAnchorRef={ StartTimeAnchorRef }
                        TimeFormat={ CurrentTimeFormat }
                        Value={ CurrentValue }
                    />
                </View>
                <View style={ [ CardStyle, Styles.CalendarCard ] }>
                    { CurrentShowEndDate
                        ? <Calendar
                            ActiveEndpoint={ CurrentActiveField }
                            Appearance="DateSheet"
                            MaxDate={ MaxDate }
                            MinDate={ MinDate }
                            Mode="Range"
                            NextMonthLabel={ Labels.NextMonth }
                            OnActiveEndpointChange={ SetActiveField }
                            OnValueChange={ HandleRangeChange }
                            PreviousMonthLabel={ Labels.PreviousMonth }
                            Style={ Styles.Calendar }
                            Value={ { End: CurrentEndValue, Start: CurrentValue } }
                            WeekdayLabels={ Labels.WeekdayLabels }
                        />
                        : <Calendar
                            Appearance="DateSheet"
                            MaxDate={ MaxDate }
                            MinDate={ MinDate }
                            NextMonthLabel={ Labels.NextMonth }
                            OnValueChange={ HandleSingleDayChange }
                            PreviousMonthLabel={ Labels.PreviousMonth }
                            Style={ Styles.Calendar }
                            Value={ CurrentValue }
                            WeekdayLabels={ Labels.WeekdayLabels }
                        /> }
                </View>
                <View style={ CardStyle }>
                    <DateSheetSwitchRow
                        Label={ Labels.EndDate }
                        OnValueChange={ HandleShowEndDateChange }
                        Value={ CurrentShowEndDate }
                    />
                    <Separator />
                    <MenuItem
                        Label={ Labels.DateFormat }
                        OnPress={ () => SetIsDateFormatOpen(true) }
                        Style={ Styles.SwitchRow }
                        ref={ DateFormatAnchorRef }>
                        <MenuItemSelect Color={ Semantic.Secondary }>
                            { CurrentDateFormatLabel }
                        </MenuItemSelect>
                    </MenuItem>
                    <DateSheetOptionPopup
                        Anchor={ DateFormatAnchorRef }
                        IsVisible={ IsDateFormatOpen }
                        OnRequestClose={ () => SetIsDateFormatOpen(false) }
                        OnValueChange={ SetDateFormat }
                        Options={ DateFormatOptions }
                        Value={ CurrentDateFormat }
                    />
                    <Separator />
                    <DateSheetSwitchRow
                        Label={ Labels.IncludeTime }
                        OnValueChange={ SetIncludeTime }
                        Value={ CurrentIncludeTime }
                    />
                    { CurrentIncludeTime && (
                        <>
                            <Separator />
                            <MenuItem
                                Label={ Labels.TimeFormat }
                                OnPress={ () => SetIsTimeFormatOpen(true) }
                                Style={ Styles.SwitchRow }
                                ref={ TimeFormatAnchorRef }>
                                <MenuItemSelect Color={ Semantic.Secondary }>
                                    { CurrentTimeFormatLabel }
                                </MenuItemSelect>
                            </MenuItem>
                            <DateSheetOptionPopup
                                Anchor={ TimeFormatAnchorRef }
                                IsVisible={ IsTimeFormatOpen }
                                OnRequestClose={ () => SetIsTimeFormatOpen(false) }
                                OnValueChange={ SetTimeFormat }
                                Options={ TimeFormatOptions }
                                Value={ CurrentTimeFormat }
                            />
                            <Separator />
                            <MenuItem
                                Label={ Labels.Timezone }
                                OnPress={ () => SetIsTimezoneOpen(true) }
                                Style={ Styles.SwitchRow }
                                ref={ TimezoneAnchorRef }>
                                <MenuItemSelect Color={ Semantic.Secondary }>
                                    {
                                        GetTimezoneAbbreviation(
                                            CurrentTimezone,
                                            CurrentValue ?? new Date())
                                    }
                                </MenuItemSelect>
                            </MenuItem>
                            <DateSheetOptionPopup
                                Anchor={ TimezoneAnchorRef }
                                IsVisible={ IsTimezoneOpen }
                                OnRequestClose={ () => SetIsTimezoneOpen(false) }
                                OnValueChange={ SetTimezone }
                                Options={ TimezoneOptions }
                                Value={ CurrentTimezone }
                            />
                            <DateSheetOptionPopup
                                Anchor={ OpenTimePopupField === "End" ? EndTimeAnchorRef : StartTimeAnchorRef }
                                IsVisible={ OpenTimePopupField !== undefined }
                                OnRequestClose={ () => SetOpenTimePopupField(undefined) }
                                OnValueChange={ HandleTimeOfDayChange }
                                Options={ TimeOfDayOptions }
                                Value={ CurrentTimeOfDayKey }
                            />
                        </>
                    ) }
                </View>
                <View style={ CardStyle }>
                    <MenuItem
                        Label={ Labels.Clear }
                        OnPress={ HandleClear }
                        Style={ Styles.SwitchRow }
                    />
                </View>
            </ScrollView>
        </Popup>
    );
};

const useStyles = MakeStyles({
    Calendar: MakeViewStyle({
        alignSelf: "center",
        width: "100%"
    }),
    CalendarCard: MakeViewStyle({
        paddingHorizontal: 16,
        paddingVertical: 12
    }),
    Card: MakeViewStyle({
        overflow: "hidden"
    }),
    Chip: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        overflow: "hidden"
    }),
    ChipDivider: MakeViewStyle({
        alignSelf: "center",
        height: 14
    }),
    ChipFlex: MakeViewStyle({
        flex: 1
    }),
    ChipFull: MakeViewStyle({
        width: "100%"
    }),
    ChipSegment: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 4,
        height: 28,
        justifyContent: "space-between",
        paddingHorizontal: 12
    }),
    ChipSegmentLabel: TextStyle({
        flexShrink: 1
    }),
    ChipSegmentPressed: MakeViewStyle({
        opacity: 0.55
    }),
    DateSegment: MakeViewStyle({
        flex: 1,
        minWidth: 0,
        paddingRight: 8
    }),
    FieldCard: MakeViewStyle({
        padding: 16
    }),
    FieldRow: MakeViewStyle({
        flexDirection: "row",
        gap: 8
    }),
    FieldRowWithEnd: MakeViewStyle({
        flexDirection: "column"
    }),
    Header: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 4
    }),
    HeaderTitle: TextStyle({
        fontSize: 15,
        lineHeight: 20
    }),
    Popup: MakeViewStyle({
        width: 360
    }),
    PopupList: MakeViewStyle({
        paddingVertical: 4
    }),
    PopupScroll: MakeViewStyle({
        maxHeight: 240
    }),
    ScrollContent: MakeViewStyle({
        maxHeight: 560,
        padding: 16
    }),
    SwitchRow: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 4,
        minHeight: 40,
        paddingHorizontal: 8
    }),
    TimeSegment: MakeViewStyle({
        flex: 1,
        minWidth: 0,
        paddingLeft: 10,
        paddingRight: 10
    })
});
