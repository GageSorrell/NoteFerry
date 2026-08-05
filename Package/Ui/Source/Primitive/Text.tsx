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

import type * as Color from "../Token/Color.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Typography from "../Token/Typography.js";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    useFonts
} from "@expo-google-fonts/inter";
import {
    Text as RNText,
    type TextProps as RNTextProps,
    type StyleProp,
    type TextStyle
} from "react-native";
import { UseColor, useTypography } from "../ThemeProvider.js";
import type { ReadonlyRecord } from "effect/Record";

/**
 * The different variants of text used across the UI.
 *
 * @category Typography
 * @since 1.0.0
 */
export type TextVariant =
    | "Heading1"
    | "Heading2"
    | "Heading3"
    | "Body"
    | "Label"
    | "Description";

const VariantToken: ReadonlyRecord<TextVariant, Typography.Typography> =
    {
        Body: Typography.Body,
        Description: Typography.Description,
        Heading1: Typography.Heading1,
        Heading2: Typography.Heading2,
        Heading3: Typography.Heading3,
        Label: Typography.Label
    };

/** {@inheritDoc Text} */
export interface TextProps extends Omit<RNTextProps, "style" | "numberOfLines" | "children">
{
    readonly Variant: TextVariant;
    readonly Weight?: TextStyle[ "fontWeight" ];

    /**
     * A `Token.Color.*` / `Token.Semantic.*` symbol, or a raw color string.
     * Defaults to `Semantic.Primary`.
     */
    readonly Color?: Color.Color | Semantic.Semantic | string | undefined;
    readonly NumberOfLines?: number;
    readonly Style?: StyleProp<TextStyle>;
    readonly children?: React.ReactNode;
}

const FontFamilies = Object.freeze({
    400: "Inter_400Regular",
    500: "Inter_500Medium",
    600: "Inter_600SemiBold",
    700: "Inter_700Bold"
} as const);

export/**
       * A base component for text, such that the variant is exposed as a prop.
       *
       * @category Component
       * @since 1.0.0
       */
const Text = ({
    Variant,
    Weight,
    Color: ColorProp,
    NumberOfLines,
    Style,
    children,
    ...RestProps
}: TextProps): React.ReactNode =>
{
    const ResolvedTypography = useTypography(VariantToken[ Variant ]);
    const TokenColorArgument = typeof ColorProp === "symbol" ? ColorProp : Semantic.Primary;
    const ResolvedTokenColor = UseColor(TokenColorArgument);
    const FinalColor = typeof ColorProp === "string" ? ColorProp : ResolvedTokenColor;

    const [ AreFontsLoaded ] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold
    });

    if (!AreFontsLoaded)
    {
        return null;
    }

    return (
        <RNText
            numberOfLines={ NumberOfLines }
            style={ [
                {
                    color: FinalColor,
                    fontFamily: FontFamilies[ResolvedTypography.FontWeight],
                    fontSize: ResolvedTypography.FontSize,
                    fontWeight: Weight ?? ResolvedTypography.FontWeight,
                    lineHeight: ResolvedTypography.LineHeight
                },
                Style
            ] }
            { ...RestProps }>
            { children }
        </RNText>
    );
};

interface InvariantTextProps extends Omit<TextProps, "Variant"> { }

/** {@inheritDoc Body} */
export interface BodyProps extends InvariantTextProps { }

/** {@inheritDoc Description} */
export interface DescriptionProps extends InvariantTextProps { }

/** {@inheritDoc Heading1} */
export interface Heading1Props extends InvariantTextProps { }

/** {@inheritDoc Heading2} */
export interface Heading2Props extends InvariantTextProps { }

/** {@inheritDoc Heading3} */
export interface Heading3Props extends InvariantTextProps { }

/** {@inheritDoc LabelText} */
export interface LabelTextProps extends InvariantTextProps { }

export/**
       * Body text.
       *
       * @category Component
       * @since 1.0.0
       */
const Body = ({ children, ...Props }: BodyProps): React.ReactNode =>
    <Text
        Variant="Body"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Body text.
       *
       * @category Component
       * @since 1.0.0
       */
const Heading1 = ({ children, ...Props }: BodyProps): React.ReactNode =>
    <Text
        Variant="Heading1"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Heading2 text.
       *
       * @category Component
       * @since 1.0.0
       */
const Heading2 = ({ children, ...Props }: Heading2Props): React.ReactNode =>
    <Text
        Variant="Heading2"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Heading3 text.
       *
       * @category Component
       * @since 1.0.0
       */
const Heading3 = ({ children, ...Props }: Heading3Props): React.ReactNode =>
    <Text
        Variant="Heading3"
        { ...Props }>
        { children }
    </Text>;

/* eslint-disable jsdoc/informative-docs */

export/**
       * Label text.
       *
       * @category Component
       * @since 1.0.0
       */
const LabelText = ({ children, ...Props }: LabelTextProps): React.ReactNode =>
    <Text
        Variant="Label"
        { ...Props }>
        { children }
    </Text>;

/* eslint-enable jsdoc/informative-docs */

export/**
       * Description text.
       *
       * @category Component
       * @since 1.0.0
       */
const Description = ({ children, ...Props }: DescriptionProps): React.ReactNode =>
    <Text
        Variant="Description"
        { ...Props }>
        { children }
    </Text>;
