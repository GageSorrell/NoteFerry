/**
 * Text input for Notion Phone number properties. Requests the OS's phone
 * keyboard via the shared `Input` primitive, with its value text pinned to
 * the same larger size and flush-left inline padding as the other
 * inline-trigger property values (Select/Status/MultiSelect/Date/Url),
 * rather than the shared `Input` primitive's smaller default text size.
 *
 * @module notivex/features/page-creation/phone-number-property-field
 *
 * @file      phone-number-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { MakeStyles, TextStyle, ViewStyle } from "@notivex/ui";
import { Input } from "@notivex/ui/Primitive";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { View } from "react-native";

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
export const PhoneNumberPropertyField = ({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: PhoneNumberPropertyFieldProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <Input
                Disabled={ Disabled }
                KeyboardType="phone-pad"
                OnChangeText={ OnValueChange }
                Placeholder="Empty"
                Style={ [ Styles.Input, Inline && Styles.InlineInput ] }
                TextStyle={ Styles.Text }
                Value={ Value }
                Variant={ Inline ? "Flat" : "Default" }
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
    InlineInput: ViewStyle({
        minHeight: 32,
        paddingHorizontal: 0
    }),
    Input: ViewStyle({
        flex: 1,
        minWidth: 0
    }),
    Text: TextStyle({
        fontSize: 16,
        lineHeight: 24
    })
});
