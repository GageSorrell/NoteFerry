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
    StyleSheet,
    View
} from "react-native";
import {
    Body,
    type BottomSheet,
    DateSheet,
    Pressable
} from "@notivex/ui/Primitive";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react-native";
import { format } from "date-fns";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { useTheme } from "@notivex/ui";

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
        <View style={ [ styles.field, Inline && styles.inlineField ] }>
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
                    styles.trigger,
                    {
                        borderColor: Theme.Semantic.Ring,
                        borderRadius: Theme.Radii.Medium
                    },
                    Inline && styles.inlineTrigger,
                    pressed && styles.triggerPressed,
                    Disabled && styles.triggerDisabled
                ] }>
                <Body
                    Color={ DisplayValue === undefined
                        ? Theme.Semantic.Muted
                        : undefined }
                    Style={ styles.value }>
                    { DisplayValue ?? "Empty" }
                </Body>
                <ChevronDown
                    color={ Theme.Semantic.Muted }
                    size={ 14 }
                    style={ styles.chevron }
                />
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

const styles = StyleSheet.create({
    chevron:
    {
        flexShrink: 0,
        marginLeft: 6
    },
    field:
    {
        gap: 6
    },
    inlineField:
    {
        flex: 1,
        minWidth: 0
    },
    inlineTrigger:
    {
        borderWidth: 0,
        minHeight: 32,
        paddingHorizontal: 0
    },
    trigger:
    {
        alignItems: "center",
        borderWidth: 1,
        flexDirection: "row",
        minHeight: 36,
        minWidth: 0,
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    triggerDisabled:
    {
        opacity: 0.55
    },
    triggerPressed:
    {
        opacity: 0.65
    },
    value:
    {
        flex: 1,
        minWidth: 0
    }
});
