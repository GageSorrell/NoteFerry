/**
 * Text input for Notion URL properties. Requests the OS's URL keyboard (its
 * "/" and ".com" affordances) and renders its value at the larger text size
 * used by the picker-based property fields (Select/Status/MultiSelect/Date),
 * rather than the shared `Input` primitive's smaller default text size.
 *
 * @module noteferry/features/page-creation/url-property-field
 *
 * @file      url-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { MakeStyles, TextStyle, ViewStyle } from "@noteferry/ui";
import { Input } from "@noteferry/ui/Primitive";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { View } from "react-native";

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
export const UrlPropertyField = ({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: UrlPropertyFieldProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <Input
                Disabled={ Disabled }
                KeyboardType="url"
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
        fontWeight: "400",
        lineHeight: 24
    })
});
