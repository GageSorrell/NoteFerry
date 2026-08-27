/**
 * Date input for a Notion page property.
 *
 * @module noteferry/features/page-creation/date-property-field
 *
 * @file      date-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import {
    Alert,
    Keyboard,
    type PressableStateCallbackType,
    View
} from "react-native";
import { Body } from "@noteferry/ui/Primitive/Text";
import { type BottomSheet } from "@noteferry/ui/Primitive/BottomSheet";
import { DateSheet } from "@noteferry/ui/Primitive/DateSheet";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { ResolveCalendarLocaleNames, ResolveDateFnsLocale } from "@/Domain/Localization";
import type { DateSheetLabels } from "@noteferry/ui/Primitive/DateSheet";
import { format } from "date-fns/format";
import type { SupportedLocale } from "@/Domain/Localization";
import { useTranslation } from "react-i18next";

/** Props for a Notion date property field. */
export interface DatePropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (
        Value: Domain.Property.DatePropertyInput | undefined
    ) => void;
    readonly Property: Domain.Property.DatePropertyDefinition;
    readonly Value?: Domain.Property.DatePropertyInput | undefined;
}

const FormatDate = (Value: Date, IncludeTime: boolean, Locale: ReturnType<typeof ResolveDateFnsLocale>): string =>
    format(Value, IncludeTime ? "PPp" : "PP", { locale: Locale });

/** Opens the shared date sheet and displays its selected date or range. */
export const DatePropertyField = ({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: DatePropertyFieldProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();
    const { i18n, t } = useTranslation("pageCreation");
    const Locale = ResolveDateFnsLocale(i18n.language as SupportedLocale);
    const DateSheetLabels_: DateSheetLabels = useMemo(() => ({
        Cancel: t("dateSheet.cancel"),
        Clear: t("dateSheet.clear"),
        DateFormat: t("dateSheet.dateFormat"),
        DateFormatDayMonthYear: t("dateSheet.dateFormatDayMonthYear"),
        DateFormatFull: t("dateSheet.dateFormatFull"),
        DateFormatMonthDayYear: t("dateSheet.dateFormatMonthDayYear"),
        DateFormatRelative: t("dateSheet.dateFormatRelative"),
        DateFormatShort: t("dateSheet.dateFormatShort"),
        DateFormatYearMonthDay: t("dateSheet.dateFormatYearMonthDay"),
        Done: t("dateSheet.done"),
        EndDate: t("dateSheet.endDate"),
        Help: t("dateSheet.help"),
        IncludeTime: t("dateSheet.includeTime"),
        NextMonth: t("dateSheet.nextMonth"),
        PreviousMonth: t("dateSheet.previousMonth"),
        SelectDate: t("dateSheet.selectDate"),
        SelectTime: t("dateSheet.selectTime"),
        TimeFormat: t("dateSheet.timeFormat"),
        TimeFormatHidden: t("dateSheet.timeFormatHidden"),
        TimeFormatTwelveHour: t("dateSheet.timeFormatTwelveHour"),
        TimeFormatTwentyFourHour: t("dateSheet.timeFormatTwentyFourHour"),
        Timezone: t("dateSheet.timezone"),
        /* `DateSheetCalendarHeader` is a *custom* header — it renders this array
         * directly rather than reading react-native-calendars' own `LocaleConfig`
         * (that system only drives the library's default, non-custom header). */
        WeekdayLabels: ResolveCalendarLocaleNames(i18n.language as SupportedLocale).DayNamesShort
    }), [ i18n.language, t ]);
    const SheetRef = useRef<BottomSheet | null>(null);
    const LatestValueRef = useRef(Value);
    const [ IncludeTime, SetIncludeTime ] = useState(false);
    const [ ShowEndDate, SetShowEndDate ] = useState(Value?.End !== undefined);

    const HandleOpenSheet = useCallback((): void =>
    {
        Keyboard.dismiss();
        SheetRef.current?.present();
    }, [ ]);

    useEffect(() =>
    {
        LatestValueRef.current = Value;
    }, [ Value ]);

    const HandleHelpPress = useCallback((): void =>
    {
        Alert.alert(
            t("propertyFields.date.helpTitle"),
            t("propertyFields.date.helpMessage")
        );
    }, [ t ]);

    const CommitValue = useCallback((
        NextValue: Domain.Property.DatePropertyInput | undefined
    ): void =>
    {
        LatestValueRef.current = NextValue;
        OnValueChange(NextValue);
    }, [ OnValueChange ]);

    const HandleStartChange = useCallback((Start: Date | undefined): void =>
    {
        if (Start === undefined)
        {
            CommitValue(undefined);

            return;
        }

        const CurrentEnd = LatestValueRef.current?.End;
        CommitValue({
            ...(CurrentEnd === undefined ? { } : { End: CurrentEnd }),
            Start,
            Type: "Date"
        });
    }, [ CommitValue ]);

    const HandleEndChange = useCallback((End: Date | undefined): void =>
    {
        const CurrentValue = LatestValueRef.current;

        if (CurrentValue === undefined)
        {
            return;
        }

        CommitValue({
            ...(End === undefined ? { } : { End }),
            Start: CurrentValue.Start,
            Type: "Date"
        });
    }, [ CommitValue ]);

    const HandleShowEndDateChange = useCallback((NextValue: boolean): void =>
    {
        SetShowEndDate(NextValue);

        if (!NextValue)
        {
            HandleEndChange(undefined);
        }
    }, [ HandleEndChange ]);

    const DisplayValue = useMemo((): string | undefined =>
    {
        if (Value === undefined)
        {
            return undefined;
        }

        const Start = FormatDate(Value.Start, IncludeTime, Locale);

        return Value.End === undefined
            ? Start
            : `${ Start } → ${ FormatDate(Value.End, IncludeTime, Locale) }`;
    }, [ IncludeTime, Locale, Value ]);

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <Pressable
                Accessibility={ {
                    Label: Property.Name,
                    Role: "button",
                    State: { disabled: Disabled }
                } }
                Disabled={ Disabled }
                OnPress={ HandleOpenSheet }
                style={ ({ pressed }: PressableStateCallbackType) => [
                    Styles.Trigger,
                    Inline && Styles.InlineTrigger,
                    pressed && Styles.TriggerPressed,
                    Disabled && Styles.TriggerDisabled
                ] }>
                <Body
                    Color={ DisplayValue === undefined
                        ? Theme.Semantic.Muted
                        : undefined }
                    Style={ Styles.Value }>
                    { DisplayValue ?? t("propertyFields.empty") }
                </Body>
            </Pressable>
            <DateSheet
                EndValue={ Value?.End }
                IncludeTime={ IncludeTime }
                Labels={ DateSheetLabels_ }
                Locale={ Locale }
                OnEndValueChange={ HandleEndChange }
                OnHelpPress={ HandleHelpPress }
                OnIncludeTimeChange={ SetIncludeTime }
                OnShowEndDateChange={ HandleShowEndDateChange }
                OnValueChange={ HandleStartChange }
                Ref={ SheetRef }
                ShowEndDate={ ShowEndDate }
                Value={ Value?.Start }
            />
        </View>
    );
};

const useStyles = MakeStyles({
    Field: ViewStyle({
        gap: 6
    }),
    InlineField: ViewStyle({
        flex: 1,
        minWidth: 0
    }),
    InlineTrigger: ViewStyle({
        borderWidth: 0,
        minHeight: 32,
        paddingHorizontal: 0
    }),
    Trigger: ViewStyle({
        alignItems: "center",
        borderColor: Token.Semantic.Ring,
        borderRadius: Token.Radii.Medium,
        borderWidth: 1,
        flexDirection: "row",
        marginBottom: -4,
        minHeight: 36,
        minWidth: 0,
        paddingHorizontal: 8,
        paddingVertical: 4
    }),
    TriggerDisabled: ViewStyle({
        opacity: 0.55
    }),
    TriggerPressed: ViewStyle({
        opacity: 0.65
    }),
    /* Measured on-device: this `Body`'s painted glyph sits ~4dp below where
     * `PropertyRow`'s cross-axis centering places its layout box (a
     * font-metrics quirk specific to this bare `Text`, not a box-model bug —
     * confirmed by testing that repositioning the surrounding boxes has no
     * effect on it). Nudging it down closes that gap against the property
     * label. Pill-wrapped values (Select/Status/MultiSelect when filled)
     * don't have this gap and must NOT get this nudge. */
    Value: TextStyle({
        flex: 1,
        marginTop: 4,
        minWidth: 0
    })
});
