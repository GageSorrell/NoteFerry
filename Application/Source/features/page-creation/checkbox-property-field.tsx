/**
 * Toggle control for Notion Checkbox properties.
 *
 * @module notivex/features/page-creation/checkbox-property-field
 *
 * @file      checkbox-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { StyleSheet, View } from "react-native";
import { Checkbox } from "@notivex/ui/Primitive";
import { PropertyLabel } from "@/features/page-creation/property-label";

/** Props for a Notion Checkbox property field. */
export interface CheckboxPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (Value: boolean) => void;
    readonly Property: Domain.Property.CheckboxPropertyDefinition;
    readonly Value?: boolean | undefined;
}

/** Renders a labeled checkbox for a Notion Checkbox property. */
export function CheckboxPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: CheckboxPropertyFieldProps): React.JSX.Element
{
    return (
        <View style={ [ styles.field, Inline && styles.inlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <View style={ styles.checkboxValue }>
                <Checkbox
                    AccessibilityLabel={ Property.Name }
                    Checked={ Value === true }
                    Disabled={ Disabled }
                    OnCheckedChange={ OnValueChange }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    checkboxValue:
    {
        alignItems: "center",
        flexDirection: "row",
        minHeight: 32
    },
    field:
    {
        gap: 6
    },
    inlineField:
    {
        flex: 1,
        minWidth: 0
    }
});
