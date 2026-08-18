/**
 * Text input for Notion Phone number properties. Requests the OS's phone
 * keyboard via the shared `Input` primitive.
 *
 * @module notivex/features/page-creation/phone-number-property-field
 *
 * @file      phone-number-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { StyleSheet, View } from "react-native";
import { Input } from "@notivex/ui/Primitive";
import { PropertyLabel } from "@/features/page-creation/property-label";

/** Props for a Notion Phone number property field. */
export interface PhoneNumberPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (Value: string) => void;
    readonly Property: Domain.Property.PhoneNumberPropertyDefinition;
    readonly Value?: string | undefined;
}

/** Renders a labeled phone number field with the OS phone keyboard. */
export function PhoneNumberPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: PhoneNumberPropertyFieldProps): React.JSX.Element
{
    return (
        <View style={ [ styles.field, Inline && styles.inlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <Input
                Disabled={ Disabled }
                KeyboardType="phone-pad"
                OnChangeText={ OnValueChange }
                Placeholder="Empty"
                Style={ styles.input }
                Value={ Value }
                Variant={ Inline ? "Flat" : "Default" }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    field:
    {
        gap: 6
    },
    inlineField:
    {
        flex: 1,
        minWidth: 0
    },
    input:
    {
        flex: 1,
        minWidth: 0
    }
});
