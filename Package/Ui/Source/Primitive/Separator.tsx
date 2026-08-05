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
import * as Semantic from "../Token/Semantic.js";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { UseColor } from "../ThemeProvider.js";

/**
 * The orientation of a given `Separator` component.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export type SeparatorOrientation =
    | "Horizontal"
    | "Vertical";

/** {@inheritDoc Separator} */
export interface SeparatorProps
{
    readonly Orientation?: SeparatorOrientation;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A thin bar that visually separates content.
       *
       * @category Component
       * @since 1.0.0
       */
const Separator = ({ Orientation = "Horizontal", Style }: SeparatorProps): React.JSX.Element =>
{
    const BorderColor = UseColor(Semantic.Border);

    return (
        <View
            accessibilityRole="none"
            style={ [
                { backgroundColor: BorderColor },
                Orientation === "Horizontal"
                    ? { height: 1, width: "100%" }
                    : { alignSelf: "stretch", width: 1 },
                Style
            ] }
        />
    );
};
