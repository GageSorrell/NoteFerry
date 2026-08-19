/**
 * Inline text link styled after Notion's muted, underlined links.
 *
 * @module @notivex/ui/Primitive/Link
 *
 * @file      Link.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    type GestureResponderEvent,
    Linking,
    type TextProps as RNTextProps
} from "react-native";
import { MakeStyles, TextStyle } from "../MakeStyles.js";

import { Text, type TextProps } from "./Text.js";

/** {@inheritDoc Link} */
export interface LinkProps extends Omit<TextProps, "Color" | "Variant" | "onPress">
{
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
       * @category Component
       * @since 1.0.0
       */
const Link = ({ Href, OnPress, Style, children, ...RestProps }: LinkProps): React.JSX.Element =>
{
    const Styles = useStyles();
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

    return (
        <Text
            Color={ Semantic.Secondary }
            Style={ [ Styles.Link, Style ] }
            Variant="Description"
            accessibilityRole="link"
            onPress={ Href !== undefined || OnPress !== undefined ? HandlePress : undefined }
            { ...RestProps }>
            { children }
        </Text>
    );
};

const useStyles = MakeStyles({
    Link: TextStyle({
        textDecorationLine: "underline"
    })
});
