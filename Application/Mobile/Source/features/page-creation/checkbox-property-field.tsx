/**
 * Toggle control for Notion Checkbox properties.
 *
 * @module noteferry/features/page-creation/checkbox-property-field
 *
 * @file      checkbox-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { MakeStyles, ViewStyle } from "@noteferry/ui";
import { Checkbox } from "@noteferry/ui/Primitive";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { View } from "react-native";

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
export const CheckboxPropertyField = ({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: CheckboxPropertyFieldProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <View style={ Styles.CheckboxValue }>
                <Checkbox
                    AccessibilityLabel={ Property.Name }
                    Checked={ Value === true }
                    Disabled={ Disabled }
                    OnCheckedChange={ OnValueChange }
                />
            </View>
        </View>
    );
};

const useStyles = MakeStyles({
    CheckboxValue: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        minHeight: 32
    }),
    Field: ViewStyle({
        gap: 6
    }),
    InlineField: ViewStyle({
        flex: 1,
        minWidth: 0
    })
});
