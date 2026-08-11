/**
 * A Notion-style "edit Date property" bottom sheet — composed from existing
 * primitives (`BottomSheet`, `Calendar`, `Switch`, `Popup`, `Menu`) rather
 * than ported from a single `@notion-kit/ui` source file. The closest
 * upstream analogue is `NotionKit/packages/table-view/src/plugins/date/
 * date-cell/date-time-picker.tsx`, which composes its own `Calendar` +
 * `DateRangeInput` + `MenuItemSwitch` + `DateFormatMenu`/`TimeFormatMenu`/
 * `TimezoneMenu` + a plain `Clear` `MenuItem` — this mirrors that shape.
 *
 * Deliberate simplifications vs. upstream (and vs. a literal pixel-for-pixel
 * screenshot match):
 *
 * - The date/time chips are read-only, tap-to-focus labels, not upstream's
 *   Zod-validated free-text `Input`s. Tapping a chip only changes which slot
 *   (`Start`/`End`) the calendar/time list is currently editing.
 * - A chip's date text always renders `MM/dd/yyyy` regardless of
 *   `DateFormat` (matching upstream's own `"_edit_mode"` format) — `Date
 *   Format` is a controlled preference this component surfaces via
 *   `OnDateFormatChange` for a caller to apply *elsewhere* (e.g. a property
 *   row), not something `DateSheet` re-renders its own chip in.
 * - The time chip opens a fixed 30-minute-increment list via `Popup`+
 *   `MenuItem`, not a native OS time picker.
 * - The timezone list uses `Intl.supportedValuesOf("timeZone")` (falling
 *   back to a short fixed list if unavailable) labeled with a live
 *   `Intl.DateTimeFormat` abbreviation (e.g. "EDT") — upstream instead
 *   labels a full IANA list with a GMT offset via `@date-fns/tz`, which
 *   isn't a dependency here, and the reference screenshots show an
 *   abbreviation rather than a GMT offset regardless.
 * - No `Remind` row exists anywhere in this component — no prop, no state,
 *   no UI.
 *
 * @module @notivex/ui/Primitive/DateSheet
 *
 * @file      DateSheet.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { Body, ModalTitle } from "./Text.js";
import {
    BottomSheet,
    BottomSheetHeader,
    type BottomSheetProps,
    BottomSheetScrollView
} from "./BottomSheet.js";
import { Calendar, type CalendarRange } from "./Calendar.js";
import { ChevronDown, HelpCircle } from "lucide-react-native";
import { MenuItem, MenuItemCheck, MenuItemSelect } from "./Menu.js";
import { Popup, type PopupAnchor } from "./Popup.js";
import {
    type Pressable,
    ScrollView,
    type StyleProp,
    StyleSheet,
    View,
    type ViewStyle
} from "react-native";
import { Button } from "./Button.js";
import { Separator } from "./Separator.js";
import { Switch } from "./Switch.js";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { UseToken } from "../ThemeProvider.js";
import { format } from "date-fns";

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

/** Exact labels/values from `NotionKit/.../date/common/date-format-menu.tsx`. */
const DateFormatOptions: ReadonlyArray<OptionEntry<DateSheetDateFormat>> =
    [
        { Label: "Full date", Value: "Full" },
        { Label: "Short date", Value: "Short" },
        { Label: "Month/Day/Year", Value: "MonthDayYear" },
        { Label: "Day/Month/Year", Value: "DayMonthYear" },
        { Label: "Year/Month/Day", Value: "YearMonthDay" },
        { Label: "Relative", Value: "Relative" }
    ];

/** Exact labels/values from `NotionKit/.../date/common/time-format-menu.tsx`. */
const TimeFormatOptions: ReadonlyArray<OptionEntry<DateSheetTimeFormat>> =
    [
        { Label: "Hidden", Value: "Hidden" },
        { Label: "12 hour", Value: "TwelveHour" },
        { Label: "24 hour", Value: "TwentyFourHour" }
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

interface TimeOption
{
    readonly Hour: number;
    readonly Minute: number;
    readonly Label: string;
}

/** 48 entries, 30-minute increments, labeled per `Pattern`. */
const BuildTimeOptions = (Pattern: string): ReadonlyArray<TimeOption> =>
{
    const Options: Array<TimeOption> = [ ];

    for (let Hour = 0; Hour < 24; Hour += 1)
    {
        for (const Minute of [ 0, 30 ])
        {
            Options.push({ Hour, Label: format(new Date(2000, 0, 1, Hour, Minute), Pattern), Minute });
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

/** Deliberately independent of `DateFormat` — see the file header comment. */
const FormatChipDate = (Value: Date | undefined): string =>
    Value === undefined ? "Select a date" : format(Value, "MM/dd/yyyy");

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
    readonly OnPress: () => void;
}

const DateSheetChipSegment = React.forwardRef<
    React.ComponentRef<typeof Pressable>,
    DateSheetChipSegmentProps
>(({ Label, OnPress }: DateSheetChipSegmentProps, ForwardedRef: React.ForwardedRef<View>) =>
{
    const { [Semantic.Muted]: MutedColor } = UseToken(Semantic.Muted);

    return (
        <TouchableOpacity
            onPress={ OnPress }
            ref={ ForwardedRef }
            style={ Styles.ChipSegment }>
            <Body
                NumberOfLines={ 1 }
                Style={ Styles.ChipSegmentLabel }>
                { Label }
            </Body>
            <ChevronDown
                color={ MutedColor }
                size={ 14 }
            />
        </TouchableOpacity>
    );

    // return (
    //     <Pressable
    //         onPress={ OnPress }
    //         ref={ ForwardedRef }
    //         style={ Styles.ChipSegment }>
    //         <Body
    //             NumberOfLines={ 1 }
    //             Style={ Styles.ChipSegmentLabel }>
    //             { Label }
    //         </Body>
    //         <ChevronDown
    //             color={ MutedColor }
    //             size={ 14 }
    //         />
    //     </Pressable>
    // );
});

DateSheetChipSegment.displayName = "DateSheetChipSegment";

interface DateSheetChipProps extends React.PropsWithChildren
{
    readonly Highlighted: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

const DateSheetChip = ({ Highlighted, Style, children }: DateSheetChipProps): React.JSX.Element =>
{
    const {
        [Semantic.Ring]: RingColor,
        [Semantic.Blue]: BlueColor,
        [Radii.Medium]: MediumRadius
    } = UseToken(
        Semantic.Ring,
        Semantic.Blue,
        Radii.Medium
    );

    return (
        <View style={ [
            Styles.Chip,
            {
                borderColor: Highlighted ? BlueColor : RingColor,
                borderRadius: MediumRadius,
                borderWidth: Highlighted ? 1.5 : 1
            },
            Style
        ] }>
            { children }
        </View>
    );
};

interface DateSheetTimeSegmentProps
{
    readonly Value: Date | undefined;
    readonly TimeFormat: DateSheetTimeFormat;
    readonly OnSelect: (Value: Date) => void;
}

const DateSheetTimeSegment = ({ Value, TimeFormat, OnSelect }: DateSheetTimeSegmentProps) =>
{
    const [ IsOpen, SetIsOpen ] = React.useState(false);
    const AnchorRef: PopupAnchor = React.useRef(null);
    const Pattern = GetTimeFormatPattern(TimeFormat);
    const Reference = Value ?? new Date(2000, 0, 1, 9, 0);
    const Options = React.useMemo(() => BuildTimeOptions(Pattern), [ Pattern ]);

    return (
        <>
            <DateSheetChipSegment
                Label={ format(Reference, Pattern) }
                OnPress={ () => SetIsOpen(true) }
                ref={ AnchorRef }
            />
            <Popup
                Anchor={ AnchorRef }
                IsVisible={ IsOpen }
                OnRequestClose={ () => SetIsOpen(false) }
                Placement="Bottom"
                Style={ { minWidth: 120 } }>
                <BottomSheetScrollView
                    contentContainerStyle={ Styles.PopupList }
                    style={ Styles.PopupScroll }>
                    { Options.map((Option: TimeOption) => (
                        <MenuItem
                            Label={ Option.Label }
                            OnPress={ () =>
                            {
                                const Next = new Date(Value ?? new Date());
                                Next.setHours(Option.Hour, Option.Minute, 0, 0);
                                OnSelect(Next);
                                SetIsOpen(false);
                            } }
                            key={ `${ Option.Hour }:${ Option.Minute }` }>
                            { Option.Hour === Reference.getHours()
                                && Option.Minute === Reference.getMinutes()
                                && <MenuItemCheck /> }
                        </MenuItem>
                    )) }
                </BottomSheetScrollView>
            </Popup>
        </>
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
    readonly OnActiveFieldChange: (Field: "Start" | "End") => void;
    readonly OnStartTimeChange: (Value: Date) => void;
    readonly OnEndTimeChange: (Value: Date) => void;
}

const DateSheetFieldRow = ({
    Value,
    EndValue,
    ShowEndDate,
    IncludeTime,
    ActiveField,
    TimeFormat,
    OnActiveFieldChange,
    OnStartTimeChange,
    OnEndTimeChange
}: DateSheetFieldRowProps): React.JSX.Element =>
    <View style={ Styles.FieldRow }>
        <DateSheetChip
            Highlighted={ ShowEndDate && ActiveField === "Start" }
            Style={ Styles.ChipFlex }>
            <DateSheetChipSegment
                Label={ FormatChipDate(Value) }
                OnPress={ () => OnActiveFieldChange("Start") }
            />
            { IncludeTime && (
                <>
                    <Separator
                        Orientation="Vertical"
                        Style={ Styles.ChipDivider }
                    />
                    <DateSheetTimeSegment
                        OnSelect={ OnStartTimeChange }
                        TimeFormat={ TimeFormat }
                        Value={ Value }
                    />
                </>
            ) }
        </DateSheetChip>
        { ShowEndDate
            ? <DateSheetChip
                Highlighted={ ActiveField === "End" }
                Style={ Styles.ChipFlex }>
                <DateSheetChipSegment
                    Label={ FormatChipDate(EndValue) }
                    OnPress={ () => OnActiveFieldChange("End") }
                />
                { IncludeTime && (
                    <>
                        <Separator
                            Orientation="Vertical"
                            Style={ Styles.ChipDivider }
                        />
                        <DateSheetTimeSegment
                            OnSelect={ OnEndTimeChange }
                            TimeFormat={ TimeFormat }
                            Value={ EndValue }
                        />
                    </>
                ) }
            </DateSheetChip>
            : <View style={ Styles.ChipFlex }><View style={ Styles.ChipSegment } /></View>
        }
    </View>;

interface DateSheetSwitchRowProps
{
    readonly Label: string;
    readonly Value: boolean;
    readonly OnValueChange: (Value: boolean) => void;
}

const DateSheetSwitchRow = ({ Label, Value, OnValueChange }: DateSheetSwitchRowProps): React.JSX.Element =>
    <View style={ Styles.SwitchRow }>
        <Body>{ Label }</Body>
        <Switch
            { ...{ OnValueChange, Value } }
            Size="Medium"
        />
    </View>;

interface DateSheetOptionPopupProps<A extends string>
{
    readonly Anchor: PopupAnchor;
    readonly IsVisible: boolean;
    readonly OnRequestClose: () => void;
    readonly Options: ReadonlyArray<OptionEntry<A>>;
    readonly Value: A;
    readonly OnValueChange: (Value: A) => void;
}

/** The one generic building block backing the "Date format"/"Time format"/"Timezone" rows. */
const DateSheetOptionPopup = <A extends string,>({
    Anchor,
    IsVisible,
    OnRequestClose,
    Options,
    Value,
    OnValueChange
}: DateSheetOptionPopupProps<A>): React.JSX.Element =>
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
    </Popup>;

/** {@inheritDoc DateSheet} */
export interface DateSheetProps extends Pick<BottomSheetProps, "OnDismiss" | "Ref">
{
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

    /** Which chip the calendar/time popovers act on; only meaningful when `ShowEndDate`. */
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
    readonly TestID?: string | undefined;
}

export/**
       * A bottom sheet for editing a date property — start/end date, an
       * optional time-of-day, and the format/timezone preferences used to
       * display them. See the file header comment for exactly how this
       * differs from Notion's own web/native implementation.
       *
       * @category Component
       * @since 1.0.0
       */
const DateSheet = ({
    OnDismiss,
    Ref,
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
    TestID
}: DateSheetProps): React.JSX.Element =>
{
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

    const WasShowEndDateRef = React.useRef(CurrentShowEndDate);
    React.useEffect(() =>
    {
        if (CurrentShowEndDate && !WasShowEndDateRef.current)
        {
            SetActiveField("End");
        }

        WasShowEndDateRef.current = CurrentShowEndDate;
    }, [ CurrentShowEndDate, SetActiveField ]);

    const HandleShowEndDateChange = React.useCallback((Next: boolean) =>
    {
        SetShowEndDate(Next);

        if (!Next)
        {
            SetEndValue(undefined);
        }
    }, [ SetShowEndDate, SetEndValue ]);

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

    const {
        [Semantic.Icon]: IconColor,
        [Semantic.BackgroundModal]: CardBackground,
        [Semantic.Border]: BorderColor,
        [Radii.Large]: LargeRadius,
        [Spacing.Xl]: BodyGap,
        [Spacing.SheetHorizontal]: HorizontalPadding,
        [Spacing.SheetVertical]: VerticalPadding
    } = UseToken(
        Semantic.Icon,
        Semantic.BackgroundModal,
        Semantic.Border,
        Radii.Large,
        Spacing.Xl,
        Spacing.SheetHorizontal,
        Spacing.SheetVertical
    );

    const CardStyle: StyleProp<ViewStyle> =
        [
            Styles.Card,
            {
                backgroundColor: CardBackground,
                borderColor: BorderColor,
                borderRadius: LargeRadius
            }
        ] as const;

    const BodyStyle: StyleProp<ViewStyle> =
        {
            gap: BodyGap,
            paddingHorizontal: HorizontalPadding,
            paddingVertical: VerticalPadding
        } as const;

    const CurrentDateFormatLabel = DateFormatOptions.find(
        (Option: OptionEntry<DateSheetDateFormat>) => Option.Value === CurrentDateFormat
    )?.Label;
    const CurrentTimeFormatLabel = TimeFormatOptions.find(
        (Option: OptionEntry<DateSheetTimeFormat>) => Option.Value === CurrentTimeFormat
    )?.Label;

    return (
        <BottomSheet
            { ...{ OnDismiss, Ref } }
            { ...(TestID === undefined ? { } : { TestId: TestID }) }>
            <BottomSheetScrollView style={ { flex: 1 } }>
                <ModalTitle Style={ { textAlign: "center" } }>
                    Date
                </ModalTitle>
                <BottomSheetHeader Style={ Styles.Header }>
                    { OnHelpPress
                        ? <Button
                            AccessibilityLabel="Help"
                            Appearance="NavIcon"
                            OnPress={ OnHelpPress }
                            Size="Circle"
                            Style={ { paddingBottom: 10 } }>
                            <HelpCircle
                                color={ IconColor }
                                size={ 18 }
                            />
                        </Button>
                        : <View style={ Styles.HeaderSpacer } /> }
                    <View style={ Styles.HeaderSpacer } />
                </BottomSheetHeader>
                <View style={ BodyStyle }>
                    <DateSheetFieldRow
                        ActiveField={ CurrentActiveField }
                        EndValue={ CurrentEndValue }
                        IncludeTime={ CurrentIncludeTime }
                        OnActiveFieldChange={ SetActiveField }
                        OnEndTimeChange={ SetEndValue }
                        OnStartTimeChange={ SetValue }
                        ShowEndDate={ CurrentShowEndDate }
                        TimeFormat={ CurrentTimeFormat }
                        Value={ CurrentValue }
                    />
                    { CurrentShowEndDate
                        ? <Calendar
                            ActiveEndpoint={ CurrentActiveField }
                            MaxDate={ MaxDate }
                            MinDate={ MinDate }
                            Mode="Range"
                            OnActiveEndpointChange={ SetActiveField }
                            OnValueChange={ HandleRangeChange }
                            Value={ { End: CurrentEndValue, Start: CurrentValue } }
                        />
                        : <Calendar
                            MaxDate={ MaxDate }
                            MinDate={ MinDate }
                            OnValueChange={ HandleSingleDayChange }
                            Value={ CurrentValue }
                        /> }
                    <View style={ CardStyle }>
                        <DateSheetSwitchRow
                            Label="End date"
                            OnValueChange={ HandleShowEndDateChange }
                            Value={ CurrentShowEndDate }
                        />
                        <Separator />
                        <MenuItem
                            Label="Date format"
                            OnPress={ () => SetIsDateFormatOpen(true) }
                            Style={ Styles.SwitchRow }
                            ref={ DateFormatAnchorRef }>
                            <MenuItemSelect>
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
                            Label="Include time"
                            OnValueChange={ SetIncludeTime }
                            Value={ CurrentIncludeTime }
                        />
                        { CurrentIncludeTime && (
                            <>
                                <Separator />
                                <MenuItem
                                    Label="Time format"
                                    OnPress={ () => SetIsTimeFormatOpen(true) }
                                    Style={ Styles.SwitchRow }
                                    ref={ TimeFormatAnchorRef }>
                                    <MenuItemSelect>
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
                                    Label="Timezone"
                                    OnPress={ () => SetIsTimezoneOpen(true) }
                                    Style={ Styles.SwitchRow }
                                    ref={ TimezoneAnchorRef }>
                                    <MenuItemSelect>
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
                            </>
                        ) }
                    </View>
                    <View style={ CardStyle }>
                        <MenuItem
                            Label="Clear"
                            OnPress={ HandleClear }
                            Style={ Styles.SwitchRow }
                        />
                    </View>
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const Styles = StyleSheet.create({
    Card:
    {
        borderWidth: 1,
        overflow: "hidden"
    },
    Chip:
    {
        alignItems: "center",
        flexDirection: "row",
        overflow: "hidden"
    },
    ChipDivider:
    {
        alignSelf: "center",
        height: 14
    },
    ChipFlex:
    {
        flex: 1
    },
    ChipFull:
    {
        flex: 1
        // width: "100%"
    },
    ChipSegment:
    {
        alignItems: "center",
        // flex: 1,
        flexDirection: "row",
        gap: 4,
        height: 32,
        justifyContent: "space-between",
        paddingHorizontal: 12
    },
    ChipSegmentLabel:
    {
        flexShrink: 1
    },
    FieldRow:
    {
        flexDirection: "row",
        gap: 8
    },
    Header:
    {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between"
    },
    HeaderSpacer:
    {
        height: 28,
        width: 28
    },
    HeaderTitle:
    {
        textAlign: "center"
    },
    PopupList:
    {
        paddingVertical: 4
    },
    PopupScroll:
    {
        maxHeight: 240
    },
    SwitchRow:
    {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 4,
        minHeight: 48,
        paddingHorizontal: 8
    }
});
