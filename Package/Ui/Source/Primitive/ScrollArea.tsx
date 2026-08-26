/**
 * Ported from `@notion-kit/ui`'s `primitives/scroll-area.tsx`. Source
 * builds a custom scrollbar/thumb on `@base-ui/react/scroll-area` because
 * the browser's native scrollbar can't be restyled; RN's `ScrollView`
 * already renders a platform-appropriate scroll indicator for free (and
 * restyling it isn't supported cross-platform either), so this is a thin,
 * token-free styled wrapper — no `ScrollBar`/`Thumb`/`Corner` parts to
 * port.
 *
 * @module @noteferry/ui/Primitive/ScrollArea
 *
 * @file      ScrollArea.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { ScrollView, type StyleProp, type ViewStyle } from "react-native";

/**
 * The orientation of a given `ScrollArea` component.
 *
 * @category Navigation
 * @since 1.0.0
 */
export type ScrollAreaOrientation =
    | "Vertical"
    | "Horizontal";

/** {@inheritDoc ScrollArea} */
export interface ScrollAreaProps extends React.PropsWithChildren
{
    readonly Orientation?: ScrollAreaOrientation;
    readonly ShowsScrollIndicator?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly ContentStyle?: StyleProp<ViewStyle>;
}

export/**
       * An area that may be scrolled by the user, by swiping.
       *
       * @category Component
       * @since 1.0.0
       */
const ScrollArea = ({
    Orientation = "Vertical",
    ShowsScrollIndicator = true,
    Style,
    ContentStyle,
    children
}: ScrollAreaProps): React.JSX.Element => (
    <ScrollView
        contentContainerStyle={ ContentStyle }
        horizontal={ Orientation === "Horizontal" }
        showsHorizontalScrollIndicator={ Orientation === "Horizontal" && ShowsScrollIndicator }
        showsVerticalScrollIndicator={ Orientation === "Vertical" && ShowsScrollIndicator }
        style={ [ { position: "relative" }, Style ] }>
        { children }
    </ScrollView>
);
