/**
 * Ported from `@notion-kit/ui`'s `primitives/badge.tsx`.
 *
 * @module @notivex/ui/Primitive/Badge
 *
 * @file      Badge.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { Description } from "./Text.js";
import { useToken } from "../ThemeProvider.js";
import { WithAlpha } from "../Utility/index.js";

/**
 * The visual style of a given `Badge` component.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export type BadgeVariant =
    |"Default"
    |"Gray"
    |"Blue"
    |"Orange"
    |"Tag";

/**
 * The size of a given `Badge` component.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export type BadgeSize =
    | "Medium"
    | "Small";

/** {@inheritDoc Badge} */
export interface BadgeProps extends React.PropsWithChildren
{
    readonly Variant?: BadgeVariant;
    readonly Size?: BadgeSize;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A compact label for displaying status, metadata, or a tag.
       *
       * @category Component
       * @since 1.0.0
       */
const Badge = ({ Variant = "Default", Size = "Medium", Style, children }: BadgeProps): React.JSX.Element =>
{
    const {
        [Semantic.Primary]: PrimaryColor,
        [Semantic.Secondary]: SecondaryColor,
        [Semantic.Blue]: BlueColor,
        [Radii.Small]: SmallRadius
    } = useToken(
        Semantic.Primary,
        Semantic.Secondary,
        Semantic.Blue,
        Radii.Small
    );

    const { Background, TextColor } = (() =>
    {
        switch (Variant)
        {
            case "Gray":
                return {
                    Background: "rgba(206, 205, 202, 0.5)",
                    TextColor: SecondaryColor
                } as const;
            case "Blue":
                return {
                    Background: WithAlpha(BlueColor, 0.1),
                    TextColor: BlueColor
                } as const;
            case "Orange":
                return {
                    Background: "rgba(246, 192, 80, 0.26)",
                    TextColor: "#D9730D"
                } as const;
            case "Tag":
                return {
                    Background: "rgba(206, 205, 202, 0.5)",
                    TextColor: PrimaryColor
                } as const;
            case "Default":
            default:
                return { Background: PrimaryColor, TextColor: "#FFFFFF" } as const;
        }
    })();

    return (
        <View
            style={ [
                {
                    alignItems: "center",
                    alignSelf: "flex-start",
                    backgroundColor: Background,
                    borderRadius: SmallRadius,
                    flexDirection: "row",
                    paddingHorizontal: Size === "Medium" ? 10 : 6,
                    paddingVertical: Size === "Medium" ? 2 : 0
                },
                Style
            ] }>
            <Description
                Color={ TextColor }
                Style={ Size === "Small" ? { fontSize: 9, lineHeight: 12 } : undefined }
                Weight={ Size === "Medium" ? "600" : "500" }>
                { children }
            </Description>
        </View>
    );
};
