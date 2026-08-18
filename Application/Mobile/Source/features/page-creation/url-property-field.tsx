/**
 * Text input for Notion URL properties. Requests the OS's URL keyboard (its
 * "/" and ".com" affordances) and renders its value at the larger text size
 * used by the picker-based property fields (Select/Status/MultiSelect/Date),
 * rather than the shared `Input` primitive's smaller default text size.
 *
 * @module notivex/features/page-creation/url-property-field
 *
 * @file      url-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { StyleSheet, View } from "react-native";
import { Input } from "@notivex/ui/Primitive";
import { PropertyLabel } from "@/features/page-creation/property-label";

/** Props for a Notion URL property field. */
export interface UrlPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (Value: string) => void;
    readonly Property: Domain.Property.UrlPropertyDefinition;
    readonly Value?: string | undefined;
}

/** Renders a labeled URL field with the OS URL keyboard and a matching text size. */
export function UrlPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: UrlPropertyFieldProps): React.JSX.Element
{
    return (
        <View style={ [ styles.field, Inline && styles.inlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <Input
                Disabled={ Disabled }
                KeyboardType="url"
                OnChangeText={ OnValueChange }
                Placeholder="Empty"
                Style={ [ styles.input, Inline && styles.inlineInput ] }
                TextStyle={ styles.text }
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
    inlineInput:
    {
        minHeight: 32,
        paddingHorizontal: 0
    },
    input:
    {
        flex: 1,
        minWidth: 0
    },
    text:
    {
        fontSize: 16,
        lineHeight: 24
    }
});
