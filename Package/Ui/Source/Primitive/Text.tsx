/**
 * Typography primitive.  `@notion-kit/ui` applies its `typography()` cva
 * ad hoc to whichever element needed it; here it's promoted to a first-class
 * `Text` component (per `PlanInitialDraft.md`'s recommendation) wrapping RN
 * `Text` and `ThemeProvider`'s `useTypography`/`useColor` hooks.
 *
 * @module @notivex/ui/Primitive/Text
 *
 * @file      Text.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Text as RNText, type StyleProp, type TextProps as RNTextProps, type TextStyle } from "react-native";

import { UseColor, useTypography } from "../ThemeProvider.js";
import * as Color from "../Token/Color.js";
import * as Semantic from "../Token/Semantic.js";
import * as Typography from "../Token/Typography.js";

export type TextVariant = "Heading1" | "Heading2" | "Heading3" | "Body" | "Label" | "Description";

const VariantToken: Record<TextVariant, Typography.Typography> = {
    Heading1: Typography.Heading1,
    Heading2: Typography.Heading2,
    Heading3: Typography.Heading3,
    Body: Typography.Body,
    Label: Typography.Label,
    Description: Typography.Description,
};

export interface TextProps extends Omit<RNTextProps, "style" | "numberOfLines" | "children"> {
    readonly Variant?: TextVariant;
    readonly Weight?: TextStyle[ "fontWeight" ];
    /** A `Token.Color.*` / `Token.Semantic.*` symbol, or a raw color string. Defaults to `Semantic.Primary`. */
    readonly Color?: Color.Color | Semantic.Semantic | string | undefined;
    readonly NumberOfLines?: number;
    readonly Style?: StyleProp<TextStyle>;
    readonly children?: React.ReactNode;
}

export const Text = ({
    Variant = "Body",
    Weight,
    Color: ColorProp,
    NumberOfLines,
    Style,
    children,
    ...RestProps
}: TextProps): React.JSX.Element =>
{
    const ResolvedTypography = useTypography(VariantToken[ Variant ]);
    const TokenColorArgument = typeof ColorProp === "symbol" ? ColorProp : Semantic.Primary;
    const ResolvedTokenColor = UseColor(TokenColorArgument);
    const FinalColor = typeof ColorProp === "string" ? ColorProp : ResolvedTokenColor;

    return (
        <RNText
            numberOfLines={ NumberOfLines }
            style={ [
                {
                    fontSize: ResolvedTypography.FontSize,
                    lineHeight: ResolvedTypography.LineHeight,
                    fontWeight: Weight ?? ResolvedTypography.FontWeight,
                    color: FinalColor,
                },
                Style,
            ] }
            { ...RestProps }
        >
            { children }
        </RNText>
    );
};
