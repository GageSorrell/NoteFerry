/**
 * Date input for a Notion page property.
 *
 * @module notivex/features/page-creation/date-property-field
 *
 * @file      date-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    Alert,
    Keyboard,
    type PressableStateCallbackType,
    View
} from "react-native";
import {
    Body,
    type BottomSheet,
    DateSheet,
    Pressable
} from "@notivex/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { format } from "date-fns";

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

const FormatDate = (Value: Date, IncludeTime: boolean): string =>
    format(Value, IncludeTime ? "MMMM d, yyyy h:mm a" : "MMMM d, yyyy");

/** Opens the shared date sheet and displays its selected date or range. */
export function DatePropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: DatePropertyFieldProps): React.JSX.Element
{
    const Theme = useTheme();
    const Styles = useStyles();
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
            "Why aren't reminders available?",
            "Notion doesn't expose date reminders through its public API, so Notivex can't create or " +
            "edit them."
        );
    }, [ ]);

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

        const Start = FormatDate(Value.Start, IncludeTime);

        return Value.End === undefined
            ? Start
            : `${ Start } → ${ FormatDate(Value.End, IncludeTime) }`;
    }, [ IncludeTime, Value ]);

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
                    { DisplayValue ?? "Empty" }
                </Body>
            </Pressable>
            <DateSheet
                EndValue={ Value?.End }
                IncludeTime={ IncludeTime }
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
}

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
    Value: TextStyle({
        flex: 1,
        minWidth: 0
    })
});
