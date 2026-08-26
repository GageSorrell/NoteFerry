/**
 * Inline text link styled after Notion's muted, underlined links.
 *
 * @module @noteferry/ui/Primitive/Link
 *
 * @file      Link.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    type GestureResponderEvent,
    Linking,
    type TextProps as RNTextProps
} from "react-native";
import { MakeStyles, TextStyle } from "../MakeStyles.js";

import { Text, type TextProps, useIsInsideText } from "./Text.js";
import { WithAlpha } from "../Utility/index.js";
import { useToken } from "../ThemeProvider.js";

/**
 * The visual style of a given `Link` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type LinkAppearance =
    | "Primary"
    | "Subtle";

/** {@inheritDoc Link} */
export interface LinkProps extends Omit<TextProps, "Color" | "Variant" | "onPress">
{
    /** The visual style of the link. Defaults to `Primary`. */
    readonly Appearance?: LinkAppearance;

    /** The URL to open when the link is pressed. */
    readonly Href?: string;

    /** A callback invoked when the link is pressed. */
    readonly OnPress?: RNTextProps["onPress"];
}

export/**
       * An inline, Notion-style text link.
       *
       * When both `OnPress` and `Href` are provided, `OnPress` is invoked
       * first and the URL is then opened by the platform link handler.
       *
       * `Appearance="Subtle"` renders smaller text that shows a dark gray,
       * rounded-corner highlight behind it while pressed — Notion's style
       * for footer links like "Privacy & terms" and "Need help?". It's
       * underline-free on its own, but picks up an underline automatically
       * when nested inside a `@noteferry/ui` `Text` (or one of its fixed-
       * `Variant` wrappers), since there it reads as an inline link within
       * prose rather than a standalone footer button.
       *
       * @category Component
       * @since 1.0.0
       */
const Link = ({ Appearance = "Primary", Href, OnPress, Style, children, ...RestProps }: LinkProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const { [ Semantic.Default ]: DefaultColor } = useToken(Semantic.Default);
    const IsInsideText = useIsInsideText();
    const [ IsPressed, SetIsPressed ] = React.useState(false);

    const HandlePress = React.useCallback<NonNullable<RNTextProps["onPress"]>>(
        (Event: GestureResponderEvent) =>
        {
            OnPress?.(Event);

            if (Href !== undefined)
            {
                Linking.openURL(Href);
            }
        },
        [ Href, OnPress ]
    );

    const HandlePressIn = React.useCallback(() => SetIsPressed(true), [ ]);
    const HandlePressOut = React.useCallback(() => SetIsPressed(false), [ ]);

    return (
        <Text
            Color={ Semantic.Secondary }
            Style={ [
                Appearance === "Subtle" ? Styles.SubtleLink : Styles.Link,
                Appearance === "Subtle" && IsInsideText ? Styles.SubtleLinkUnderline : undefined,
                Appearance === "Subtle" && IsPressed
                    ? { backgroundColor: WithAlpha(DefaultColor, 0.12) }
                    : undefined,
                Style
            ] }
            Variant={ Appearance === "Subtle" ? "Caption" : "Description" }
            accessibilityRole="link"
            onPress={ Href !== undefined || OnPress !== undefined ? HandlePress : undefined }
            onPressIn={ Appearance === "Subtle" ? HandlePressIn : undefined }
            onPressOut={ Appearance === "Subtle" ? HandlePressOut : undefined }
            { ...RestProps }>
            { children }
        </Text>
    );
};

const useStyles = MakeStyles({
    Link: TextStyle({
        textDecorationLine: "underline"
    }),
    SubtleLink: TextStyle({
        borderRadius: Radii.Small,
        overflow: "hidden",
        paddingHorizontal: 6,
        paddingVertical: 3
    }),
    SubtleLinkUnderline: TextStyle({
        textDecorationLine: "underline"
    })
});
