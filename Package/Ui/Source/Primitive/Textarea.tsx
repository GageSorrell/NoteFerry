/**
 * Ported from `@notion-kit/ui`'s `primitives/textarea.tsx`.
 *
 * @module @noteferry/ui/Primitive/Textarea
 *
 * @file      Textarea.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { MakeStyles, TextStyle as MakeTextStyle } from "../MakeStyles.js";
import { type StyleProp, TextInput, type TextStyle } from "react-native";
import { WithAlpha } from "../Utility/index.js";
import { useToken } from "../ThemeProvider.js";

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
    const Styles = useStyles();
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

const useStyles = MakeStyles({
    Base: MakeTextStyle({
        borderWidth: 1,
        /* Matches `Input`'s own fix: every value rendered through
         * `@noteferry/ui`'s `Text` primitives renders in Inter, but a bare RN
         * `TextInput` has no font applied by default and silently falls
         * back to the OS system font, which reads visibly smaller/larger
         * than Inter at the same nominal `fontSize`. */
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        lineHeight: 20,
        padding: 10,
        textAlignVertical: "top",
        width: "100%"
    })
});
