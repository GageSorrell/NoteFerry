/**
 * Ported from `@notion-kit/ui`'s `primitives/separator.tsx`.
 *
 * @module @notivex/ui/Primitive/Separator
 *
 * @file      Separator.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { UseColor } from "../ThemeProvider.js";
import * as Semantic from "../Token/Semantic.js";

export type SeparatorOrientation = "Horizontal" | "Vertical";

export interface SeparatorProps {
    readonly Orientation?: SeparatorOrientation;
    readonly Style?: StyleProp<ViewStyle>;
}

export const Separator = ({ Orientation = "Horizontal", Style }: SeparatorProps): React.JSX.Element =>
{
    const BorderColor = UseColor(Semantic.Border);

    return (
        <View
            accessibilityRole="none"
            style={ [
                { backgroundColor: BorderColor },
                Orientation === "Horizontal" ? { height: 1, width: "100%" } : { width: 1, alignSelf: "stretch" },
                Style,
            ] }
        />
    );
};
