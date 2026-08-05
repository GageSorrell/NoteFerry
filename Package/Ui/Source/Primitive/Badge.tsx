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

import * as React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { UseColor, useRadii } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";
import { Text } from "./Text.js";

export type BadgeVariant = "Default" | "Gray" | "Blue" | "Orange" | "Tag";
export type BadgeSize = "Medium" | "Small";

export interface BadgeProps {
    readonly Variant?: BadgeVariant;
    readonly Size?: BadgeSize;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const Badge = ({ Variant = "Default", Size = "Medium", Style, children }: BadgeProps): React.JSX.Element =>
{
    const PrimaryColor = UseColor(Semantic.Primary);
    const SecondaryColor = UseColor(Semantic.Secondary);
    const BlueColor = UseColor(Semantic.Blue);
    const SmallRadius = useRadii(Radii.Small);

    const { Background, TextColor } = (() =>
    {
        switch (Variant)
        {
            case "Gray": return { Background: "rgba(206, 205, 202, 0.5)", TextColor: SecondaryColor };
            case "Blue": return { Background: WithAlpha(BlueColor, 0.1), TextColor: BlueColor };
            case "Orange": return { Background: "rgba(246, 192, 80, 0.26)", TextColor: "#D9730D" };
            case "Tag": return { Background: "rgba(206, 205, 202, 0.5)", TextColor: PrimaryColor };
            case "Default":
            default: return { Background: PrimaryColor, TextColor: "#FFFFFF" };
        }
    })();

    return (
        <View
            style={ [
                {
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: SmallRadius,
                    backgroundColor: Background,
                    paddingHorizontal: Size === "Medium" ? 10 : 6,
                    paddingVertical: Size === "Medium" ? 2 : 0,
                },
                Style,
            ] }
        >
            <Text
                Variant="Description"
                Weight={ Size === "Medium" ? "600" : "500" }
                Color={ TextColor }
                Style={ Size === "Small" ? { fontSize: 9, lineHeight: 12 } : undefined }
            >
                { children }
            </Text>
        </View>
    );
};
