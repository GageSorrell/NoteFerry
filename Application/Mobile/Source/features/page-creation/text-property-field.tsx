/**
 * Single-line text input for Notion Rich text properties.
 *
 * @module notivex/features/page-creation/text-property-field
 *
 * @file      text-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { MakeStyles, TextStyle, ViewStyle } from "@notivex/ui";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { Textarea } from "@notivex/ui/Primitive";
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
export function TextPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: TextPropertyFieldProps): React.JSX.Element
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
}

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
        paddingVertical: 5
    })
});
