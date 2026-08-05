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

import * as React from "react";
import { StyleSheet, TextInput, type StyleProp, type ViewStyle } from "react-native";

import { UseColor, useRadii } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";

export interface TextareaProps {
    readonly Value?: string;
    readonly Placeholder?: string;
    readonly OnChangeText?: (Text: string) => void;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly NumberOfLines?: number;
}

export const Textarea = ({
    Value,
    Placeholder,
    OnChangeText,
    Disabled = false,
    Style,
    NumberOfLines = 4,
}: TextareaProps): React.JSX.Element =>
{
    const RingColor = UseColor(Semantic.Ring);
    const InputBackground = UseColor(Semantic.BackgroundInput);
    const PrimaryColor = UseColor(Semantic.Primary);
    const MediumRadius = useRadii(Radii.Medium);

    return (
        <TextInput
            multiline
            value={ Value }
            onChangeText={ OnChangeText }
            placeholder={ Placeholder }
            placeholderTextColor={ WithAlpha(PrimaryColor, 0.45) }
            editable={ !Disabled }
            numberOfLines={ NumberOfLines }
            style={ [
                Styles.Base,
                {
                    minHeight: 80,
                    borderRadius: MediumRadius,
                    backgroundColor: InputBackground,
                    borderColor: RingColor,
                    color: PrimaryColor,
                    opacity: Disabled ? 0.5 : 1,
                },
                Style,
            ] }
        />
    );
};

const Styles = StyleSheet.create({
    Base: {
        width: "100%",
        borderWidth: 1,
        padding: 10,
        fontSize: 14,
        lineHeight: 20,
        textAlignVertical: "top",
    },
});
