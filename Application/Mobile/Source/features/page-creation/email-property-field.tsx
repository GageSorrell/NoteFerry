/**
 * Text input for Notion Email properties. Requests the OS's email keyboard
 * (its "@" affordance) via the shared `Input` primitive.
 *
 * @module notivex/features/page-creation/email-property-field
 *
 * @file      email-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { MakeStyles, ViewStyle } from "@notivex/ui";
import { Input } from "@notivex/ui/Primitive";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { View } from "react-native";

/** Props for a Notion Email property field. */
export interface EmailPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (Value: string) => void;
    readonly Property: Domain.Property.EmailPropertyDefinition;
    readonly Value?: string | undefined;
}

/** Renders a labeled email field with the OS email keyboard. */
export function EmailPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: EmailPropertyFieldProps): React.JSX.Element
{
    const Styles = useStyles();

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <Input
                Disabled={ Disabled }
                KeyboardType="email-address"
                OnChangeText={ OnValueChange }
                Placeholder="Empty"
                Style={ Styles.Input }
                Value={ Value }
                Variant={ Inline ? "Flat" : "Default" }
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
    Input: ViewStyle({
        flex: 1,
        minWidth: 0
    })
});
