/**
 * Single-line text input for Notion Rich text properties.
 *
 * @module noteferry/features/page-creation/text-property-field
 *
 * @file      text-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { MakeStyles, TextStyle, ViewStyle } from "@noteferry/ui";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { Textarea } from "@noteferry/ui/Primitive";
import { View } from "react-native";

/** Props for a Notion Rich text property field. */
export interface TextPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (Value: string) => void;
    readonly Property: Domain.Property.RichTextPropertyDefinition;
    readonly Value?: string | undefined;
}

/** Renders a labeled single-line text field for a Notion Rich text property. */
export const TextPropertyField = ({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: TextPropertyFieldProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <Textarea
                Disabled={ Disabled }
                NumberOfLines={ 1 }
                OnChangeText={ OnValueChange }
                Placeholder="Empty"
                Style={ Inline ? Styles.InlineTextarea : undefined }
                Value={ Value }
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
    InlineTextarea: TextStyle({
        backgroundColor: "transparent",
        borderWidth: 0,
        minHeight: 32,
        paddingHorizontal: 0,
        // paddingVertical: 5,
        /* `Textarea`'s shared default is top-aligned, correct for the
         * multi-line page body — but this single-line (`NumberOfLines={1}`)
         * inline use is a property row, where the value should center like
         * every other field's. */
        textAlignVertical: "center"
    })
});
