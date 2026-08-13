/**
 * Ported from `@notion-kit/ui`'s `primitives/textarea.tsx`.
 *
 * @module @notivex/ui/Primitive/Textarea
 *
 * @file      Textarea.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { type StyleProp, StyleSheet, TextInput, type TextStyle } from "react-native";
import { useToken } from "../ThemeProvider.js";
import { WithAlpha } from "../Utility/index.js";

/** {@inheritDoc Textarea} */
export interface TextareaProps
{
    readonly AccessibilityLabel?: string;
    readonly Value?: string;
    readonly Placeholder?: string;
    readonly OnChangeText?: (Text: string) => void;
    readonly Disabled?: boolean;
    readonly MaxLength?: number;
    readonly Style?: StyleProp<TextStyle>;
    readonly NumberOfLines?: number;
}

export/**
       * A themed multi-line text input with configurable visible line count.
       *
       * @category Component
       * @since 1.0.0
       */
const Textarea = ({
    AccessibilityLabel,
    Value,
    Placeholder,
    OnChangeText,
    Disabled = false,
    MaxLength,
    Style,
    NumberOfLines = 4
}: TextareaProps): React.JSX.Element =>
{
    const {
        [ Semantic.Ring ]: RingColor,
        [ Semantic.BackgroundInput ]: InputBackground,
        [ Semantic.Primary ]: PrimaryColor,
        [ Semantic.Cursor ]: CursorColor,
        [ Radii.Medium ]: MediumRadius
    } = useToken(
        Semantic.Ring,
        Semantic.BackgroundInput,
        Semantic.Primary,
        Semantic.Cursor,
        Radii.Medium
    );

    return (
        <TextInput
            accessibilityLabel={ AccessibilityLabel }
            cursorColor={ CursorColor }
            editable={ !Disabled }
            maxLength={ MaxLength }
            multiline
            numberOfLines={ NumberOfLines }
            onChangeText={ OnChangeText }
            placeholder={ Placeholder }
            placeholderTextColor={ WithAlpha(PrimaryColor, 0.45) }
            selectionColor={ CursorColor }
            style={ [
                Styles.Base,
                {
                    backgroundColor: InputBackground,
                    borderColor: RingColor,
                    borderRadius: MediumRadius,
                    color: PrimaryColor,
                    minHeight: 80,
                    opacity: Disabled ? 0.5 : 1
                },
                Style
            ] }
            value={ Value }
        />
    );
};

const Styles = StyleSheet.create({
    Base:
    {
        borderWidth: 1,
        fontSize: 14,
        lineHeight: 20,
        padding: 10,
        textAlignVertical: "top",
        width: "100%"
    }
});
