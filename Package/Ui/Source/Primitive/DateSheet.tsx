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
 * - The date/time chips are read-only labels, not upstream's Zod-validated
 *   free-text `Input`s. Tapping either chip opens the platform-native picker.
 * - A chip's date text always renders `MM/dd/yyyy` regardless of
 *   `DateFormat` (matching upstream's own `"_edit_mode"` format) — `Date
 *   Format` is a controlled preference this component surfaces via
 *   `OnDateFormatChange` for a caller to apply *elsewhere* (e.g. a property
 *   row), not something `DateSheet` re-renders its own chip in.
 * - The timezone list uses `Intl.supportedValuesOf("timeZone")` (falling
 *   back to a short fixed list if unavailable) labeled with a live
 *   `Intl.DateTimeFormat` abbreviation (e.g. "EDT") — upstream instead
 *   labels a full IANA list with a GMT offset via `@date-fns/tz`, which
 *   isn't a dependency here, and the reference screenshots show an
 *   abbreviation rather than a GMT offset regardless.
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
    type BottomSheetProps,
    BottomSheetScrollView
} from "./BottomSheet.js";
import { Calendar, type CalendarRange } from "./Calendar.js";
import { ChevronDown, HelpCircle } from "lucide-react-native";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./Dialog.js";
import { MakeStyles, ViewStyle as MakeViewStyle, TextStyle } from "../MakeStyles.js";
import { MenuItem, MenuItemCheck, MenuItemSelect } from "./Menu.js";
import {
    Platform,
    type PressableStateCallbackType,
    ScrollView,
    type StyleProp,
    View,
    type ViewStyle
} from "react-native";
import { Popup, type PopupAnchor } from "./Popup.js";
import { Button } from "./Button.js";
import { DateTimePicker as NativeDateTimePicker } from "@expo/ui/community/datetime-picker";
import { Pressable } from "./Pressable.js";
import { Separator } from "./Separator.js";
import { Switch } from "./Switch.js";
import type { Thunk } from "@sorrell/effect/Function";
import { WithAlpha } from "../Utility/index.js";
import { format } from "date-fns";
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

const DateSheetSnapPoints = [ "94%" ];

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

/** Keeps `Previous`'s hour/minute (defaulting to 9:00 AM) when a new calendar day is tapped. */
const CombineDateAndTime = (Day: Date, Previous: Date | undefined): Date =>
{
    const Result = new Date(Day);
    Result.setHours(Previous?.getHours() ?? 9, Previous?.getMinutes() ?? 0, 0, 0);
    return Result;
};

/** Keeps `Previous`'s day while replacing only its time-of-day. */
const CombineTimeAndDate = (Time: Date, Previous: Date | undefined): Date =>
{
    const Result = new Date(Previous ?? Time);
    Result.setHours(Time.getHours(), Time.getMinutes(), 0, 0);
    return Result;
};

/** Removes any time portion when the sheet's "Include time" option is off. */
const ToDateOnly = (Value: Date): Date =>
    new Date(Value.getFullYear(), Value.getMonth(), Value.getDate());

/**
 * Material 3's Android date picker reports the selected calendar day as UTC
 * midnight. Reading that value with local date getters moves it to the
 * previous day in timezones west of UTC, so convert its UTC date parts back
 * into a local calendar date before merging it with the property's time.
 * Time-picker results are local instants and must not use this conversion.
 */
const NormalizeNativeDatePickerValue = (Value: Date): Date =>
    Platform.OS === "android"
        ? new Date(Value.getUTCFullYear(), Value.getUTCMonth(), Value.getUTCDate())
        : Value;

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
    readonly OnPress: Thunk;
    readonly Style?: StyleProp<ViewStyle>;
}

const DateSheetChipSegment = React.forwardRef<
    React.ComponentRef<typeof Pressable>,
    DateSheetChipSegmentProps
>(({
    Label,
    OnPress,
    Style
}: DateSheetChipSegmentProps, ForwardedRef: React.ForwardedRef<View>) =>
{
    const Styles = useStyles();
    const { [Semantic.Muted]: MutedColor } = useToken(Semantic.Muted);

    return (
        <Pressable
            Accessibility={ {
                Label,
                Role: "button"
            } }
            OnPress={ OnPress }
            ref={ ForwardedRef }
            style={ ({ pressed }: PressableStateCallbackType) => [
                Styles.ChipSegment,
                Style,
                pressed && Styles.ChipSegmentPressed
            ] }>
            <Body
                NumberOfLines={ 1 }
                Style={ Styles.ChipSegmentLabel }>
                { Label }
            </Body>
            <ChevronDown
                color={ MutedColor }
                size={ 14 }
            />
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

interface DateSheetTimeSegmentProps
{
    readonly OnPress: Thunk;
    readonly Value: Date | undefined;
    readonly TimeFormat: DateSheetTimeFormat;
}

const DateSheetTimeSegment = ({ OnPress, Value, TimeFormat }: DateSheetTimeSegmentProps) =>
{
    const Styles = useStyles();
    const Pattern = GetTimeFormatPattern(TimeFormat);
    const Reference = Value ?? new Date(2000, 0, 1, 9, 0);

    return (
        <DateSheetChipSegment
            Label={ format(Reference, Pattern) }
            OnPress={ OnPress }
            Style={ Styles.TimeSegment }
        />
    );
};

type NativePickerMode = "date" | "time";

interface NativePickerRequest
{
    readonly Field: "Start" | "End";
    readonly Mode: NativePickerMode;
    readonly Value: Date;
}

interface DateSheetNativePickerProps
{
    readonly AccentColor: string;
    readonly MaxDate: Date | undefined;
    readonly MinDate: Date | undefined;
    readonly OnDismiss: Thunk;
    readonly OnValueChange: (Value: Date) => void;
    readonly Request: NativePickerRequest;
    readonly TimeFormat: DateSheetTimeFormat;
    readonly Timezone: string;
}

const DateSheetNativePicker = ({
    AccentColor,
    MaxDate,
    MinDate,
    OnDismiss,
    OnValueChange,
    Request,
    TimeFormat,
    Timezone
}: DateSheetNativePickerProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const [ DraftValue, SetDraftValue ] = React.useState(Request.Value);
    const Title = Request.Mode === "date" ? "Select a date" : "Select a time";

    const Picker = (
        <NativeDateTimePicker
            accentColor={ AccentColor }
            display={ Platform.OS === "ios" ? "spinner" : "default" }
            is24Hour={ TimeFormat === "TwentyFourHour" }
            mode={ Request.Mode }
            { ...(Request.Mode === "date" && MaxDate !== undefined
                ? { maximumDate: MaxDate }
                : { }) }
            { ...(Request.Mode === "date" && MinDate !== undefined
                ? { minimumDate: MinDate }
                : { }) }
            negativeButton={ { label: "Cancel" } }
            onDismiss={ OnDismiss }
            onValueChange={ (_Event: unknown, Value: Date) =>
            {
                if (Platform.OS === "android")
                {
                    OnValueChange(Value);
                }
                else
                {
                    SetDraftValue(Value);
                }
            } }
            positiveButton={ { label: "Done" } }
            presentation="dialog"
            style={ Platform.OS === "ios" ? Styles.NativePicker : undefined }
            timeZoneName={ Timezone }
            value={ Platform.OS === "android" ? Request.Value : DraftValue }
        />
    );

    if (Platform.OS === "android")
    {
        return Picker;
    }

    return (
        <Dialog
            OnOpenChange={ (Open: boolean) =>
            {
                if (!Open)
                {
                    OnDismiss();
                }
            } }
            Open>
            <DialogContent HideClose
                Style={ Styles.NativePickerDialog }>
                <DialogHeader>
                    <DialogTitle>{ Title }</DialogTitle>
                </DialogHeader>
                { Picker }
                <DialogFooter Style={ Styles.NativePickerFooter }>
                    <Button
                        Appearance="Hint"
                        OnPress={ OnDismiss }
                        Size="Small">
                        Cancel
                    </Button>
                    <Button
                        Appearance="Blue"
                        OnPress={ () => OnValueChange(DraftValue) }
                        Size="Small">
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
    readonly OnOpenPicker: (Field: "Start" | "End", Mode: NativePickerMode) => void;
}

const DateSheetFieldRow = ({
    Value,
    EndValue,
    ShowEndDate,
    IncludeTime,
    ActiveField,
    TimeFormat,
    OnOpenPicker
}: DateSheetFieldRowProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View style={ [
            Styles.FieldRow,
            ShowEndDate && Styles.FieldRowWithEnd
        ] }>
            <DateSheetChip
                Highlighted={ ActiveField === "Start" && Value !== undefined }
                Style={ ShowEndDate ? Styles.ChipFull : Styles.ChipFlex }>
                <DateSheetChipSegment
                    Label={ FormatChipDate(Value) }
                    OnPress={ () => OnOpenPicker("Start", "date") }
                    Style={ Styles.DateSegment }
                />
                { IncludeTime && (
                    <>
                        <Separator
                            Orientation="Vertical"
                            Style={ Styles.ChipDivider }
                        />
                        <DateSheetTimeSegment
                            OnPress={ () => OnOpenPicker("Start", "time") }
                            TimeFormat={ TimeFormat }
                            Value={ Value }
                        />
                    </>
                ) }
            </DateSheetChip>
            { ShowEndDate
                && <DateSheetChip
                    Highlighted={ ActiveField === "End" && EndValue !== undefined }
                    Style={ Styles.ChipFull }>
                    <DateSheetChipSegment
                        Label={ FormatChipDate(EndValue) }
                        OnPress={ () => OnOpenPicker("End", "date") }
                        Style={ Styles.DateSegment }
                    />
                    { IncludeTime && (
                        <>
                            <Separator
                                Orientation="Vertical"
                                Style={ Styles.ChipDivider }
                            />
                            <DateSheetTimeSegment
                                OnPress={ () => OnOpenPicker("End", "time") }
                                TimeFormat={ TimeFormat }
                                Value={ EndValue }
                            />
                        </>
                    ) }
                </DateSheetChip> }
        </View>
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

interface DateSheetOptionPopupProps<A extends string>
{
    readonly Anchor: PopupAnchor;
    readonly IsVisible: boolean;
    readonly OnRequestClose: Thunk;
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
    /** Heading displayed at the top of the sheet. */
    readonly Title?: string | undefined;
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
    TestID,
    Title = "Date"
}: DateSheetProps): React.JSX.Element =>
{
    const Styles = useStyles();
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
    const [ NativePicker, SetNativePicker ] = React.useState<NativePickerRequest | undefined>();

    const HandleSheetChange = React.useCallback((Index: number) =>
    {
        if (Index >= 0)
        {
            SetActiveField("Start");
        }
    }, [ SetActiveField ]);

    const HandleOpenNativePicker = React.useCallback((
        Field: "Start" | "End",
        Mode: NativePickerMode
    ) =>
    {
        const ExistingValue = Field === "Start" ? CurrentValue : CurrentEndValue;
        const PickerValue = new Date(ExistingValue ?? CurrentValue ?? new Date());

        if (ExistingValue === undefined)
        {
            PickerValue.setHours(9, 0, 0, 0);
        }

        SetActiveField(Field);
        SetNativePicker({ Field, Mode, Value: PickerValue });
    }, [ CurrentValue, CurrentEndValue, SetActiveField ]);

    const HandleNativePickerValueChange = React.useCallback((Value: Date) =>
    {
        if (NativePicker === undefined)
        {
            return;
        }

        const PreviousValue = NativePicker.Field === "Start" ? CurrentValue : CurrentEndValue;
        const NextValue = NativePicker.Mode === "date"
            ? CurrentIncludeTime
                ? CombineDateAndTime(
                    NormalizeNativeDatePickerValue(Value),
                    PreviousValue
                )
                : ToDateOnly(NormalizeNativeDatePickerValue(Value))
            : CombineTimeAndDate(Value, PreviousValue ?? NativePicker.Value);

        if (NativePicker.Field === "Start")
        {
            SetValue(NextValue);
        }
        else
        {
            SetEndValue(NextValue);
        }

        SetNativePicker(undefined);
    }, [
        CurrentEndValue,
        CurrentIncludeTime,
        CurrentValue,
        NativePicker,
        SetEndValue,
        SetValue
    ]);

    const HandleNativePickerDismiss = React.useCallback(() => SetNativePicker(undefined), [ ]);

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
        [Semantic.Blue]: AccentColor,
        [Semantic.Icon]: IconColor,
        [Semantic.BackgroundSidebar]: SheetBackground,
        [Semantic.BackgroundModal]: CardBackground,
        [Radii.Large]: LargeRadius,
        [Spacing.L]: BodyGap,
        [Spacing.SheetVertical]: VerticalPadding
    } = useToken(
        Semantic.Blue,
        Semantic.Icon,
        Semantic.BackgroundSidebar,
        Semantic.BackgroundModal,
        Radii.Large,
        Spacing.L,
        Spacing.SheetVertical
    );

    const CardStyle: StyleProp<ViewStyle> =
        [
            Styles.Card,
            {
                backgroundColor: CardBackground,
                borderRadius: LargeRadius
            }
        ] as const;

    const BodyStyle: StyleProp<ViewStyle> =
        {
            gap: BodyGap,
            paddingHorizontal: 32,
            paddingVertical: VerticalPadding
        } as const;

    const CurrentDateFormatLabel = DateFormatOptions.find(
        (Option: OptionEntry<DateSheetDateFormat>) => Option.Value === CurrentDateFormat
    )?.Label;
    const CurrentTimeFormatLabel = TimeFormatOptions.find(
        (Option: OptionEntry<DateSheetTimeFormat>) => Option.Value === CurrentTimeFormat
    )?.Label;

    return (
        <>
            <BottomSheet
                { ...{ OnDismiss, Ref } }
                BackgroundColor={ SheetBackground }
                OnChange={ HandleSheetChange }
                SnapPoints={ DateSheetSnapPoints }
                { ...(TestID === undefined ? { } : { TestId: TestID }) }>
                <BottomSheetScrollView
                    contentContainerStyle={ Styles.ScrollContent }
                    style={ { backgroundColor: SheetBackground, flex: 1 } }>
                    <View style={ Styles.Header }>
                        { OnHelpPress
                            ? <Button
                                AccessibilityLabel="Help"
                                Appearance="NavIcon"
                                OnPress={ OnHelpPress }
                                Size="Circle">
                                <HelpCircle
                                    color={ IconColor }
                                    size={ 18 }
                                />
                            </Button>
                            : <View style={ Styles.HeaderSpacer } /> }
                        <ModalTitle Style={ Styles.HeaderTitle }>
                            { Title }
                        </ModalTitle>
                        <View style={ Styles.HeaderSpacer } />
                    </View>
                    <View style={ BodyStyle }>
                        <View style={ [ CardStyle, Styles.FieldCard ] }>
                            <DateSheetFieldRow
                                ActiveField={ CurrentActiveField }
                                EndValue={ CurrentEndValue }
                                IncludeTime={ CurrentIncludeTime }
                                OnOpenPicker={ HandleOpenNativePicker }
                                ShowEndDate={ CurrentShowEndDate }
                                TimeFormat={ CurrentTimeFormat }
                                Value={ CurrentValue }
                            />
                        </View>
                        <View style={ [ CardStyle, Styles.CalendarCard ] }>
                            <View style={ Styles.CalendarFrame }>
                                { CurrentShowEndDate
                                    ? <Calendar
                                        ActiveEndpoint={ CurrentActiveField }
                                        Appearance="DateSheet"
                                        MaxDate={ MaxDate }
                                        MinDate={ MinDate }
                                        Mode="Range"
                                        OnActiveEndpointChange={ SetActiveField }
                                        OnValueChange={ HandleRangeChange }
                                        Style={ Styles.Calendar }
                                        Value={ { End: CurrentEndValue, Start: CurrentValue } }
                                    />
                                    : <Calendar
                                        Appearance="DateSheet"
                                        MaxDate={ MaxDate }
                                        MinDate={ MinDate }
                                        OnValueChange={ HandleSingleDayChange }
                                        Style={ Styles.Calendar }
                                        Value={ CurrentValue }
                                    /> }
                            </View>
                        </View>
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
                                        Label="Timezone"
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
            { NativePicker !== undefined && (
                <DateSheetNativePicker
                    AccentColor={ AccentColor }
                    MaxDate={ MaxDate }
                    MinDate={ MinDate }
                    OnDismiss={ HandleNativePickerDismiss }
                    OnValueChange={ HandleNativePickerValueChange }
                    Request={ NativePicker }
                    TimeFormat={ CurrentTimeFormat }
                    Timezone={ CurrentTimezone }
                />
            ) }
        </>
    );
};

const useStyles = MakeStyles({
    Calendar: MakeViewStyle({
        alignSelf: "center",
        width: "94%"
    }),
    CalendarCard: MakeViewStyle({
        paddingHorizontal: 16
    }),
    CalendarFrame: MakeViewStyle({
        justifyContent: "flex-start",
        paddingBottom: 16,
        width: "100%"
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
        minHeight: 44,
        paddingHorizontal: 10
    }),
    HeaderSpacer: MakeViewStyle({
        height: 28,
        width: 28
    }),
    HeaderTitle: TextStyle({
        flex: 1,
        fontSize: 15,
        lineHeight: 20,
        textAlign: "center",
        transform: [ { translateY: -14 } ]
    }),
    NativePicker: MakeViewStyle({
        height: 216,
        width: "100%"
    }),
    NativePickerDialog: MakeViewStyle({
        width: 340
    }),
    NativePickerFooter: MakeViewStyle({
        alignSelf: "stretch",
        flexDirection: "row",
        justifyContent: "flex-end"
    }),
    PopupList: MakeViewStyle({
        paddingVertical: 4
    }),
    PopupScroll: MakeViewStyle({
        maxHeight: 240
    }),
    ScrollContent: MakeViewStyle({
        paddingBottom: 24
    }),
    SwitchRow: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 4,
        minHeight: 48,
        paddingHorizontal: 8
    }),
    TimeSegment: MakeViewStyle({
        flex: 1,
        minWidth: 0,
        paddingLeft: 10,
        paddingRight: 10
    })
});
