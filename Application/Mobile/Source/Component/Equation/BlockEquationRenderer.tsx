/**
 * Plain-RN wrapper around `KatexBlockEquation` -- shows the plain-text
 * `Fallback` (loading state, and permanently on error), then swaps in the
 * live-rendered WebView once KaTeX has synchronously rendered. See
 * `EquationRenderer.tsx` for how this and `InlineEquationRenderer` compose
 * into one `EquationRenderer` passed down to `NotionMarkdownText`/
 * `NotionMarkdownBlockEditor`.
 *
 * @module noteferry/Component/Equation/BlockEquationRenderer
 *
 * @file      BlockEquationRenderer.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { StyleSheet, View, type ViewStyle } from "react-native";
import { useCallback, useState } from "react";
import KatexBlockEquation from "./KatexBlockEquation";

/** {@inheritDoc BlockEquationRenderer} */
export interface BlockEquationRendererProps
{
    readonly Expression: string;
    readonly Style?: ViewStyle | undefined;
    readonly Fallback: React.ReactElement;
}

type RenderStatus = "loading" | "ready" | "error";

export/**
       * Live-renders a block equation via `KatexBlockEquation`, falling back
       * to plain LaTeX source while it loads and permanently on a malformed
       * expression.
       *
       * @category Components
       * @since 1.0.0
       */
const BlockEquationRenderer = ({ Expression, Style, Fallback }: BlockEquationRendererProps): React.JSX.Element =>
{
    const [ Status, SetStatus ] = useState<RenderStatus>("loading");

    // Re-attempt on a changed expression, e.g. live-editing a block's raw
    // source elsewhere in the surface and blurring back onto this one --
    // adjusted during render (React's recommended "resetting state when a
    // prop changes" pattern) rather than in an effect, which would cost an
    // extra commit.
    const [ TrackedExpression, SetTrackedExpression ] = useState(Expression);
    if (Expression !== TrackedExpression)
    {
        SetTrackedExpression(Expression);
        SetStatus("loading");
    }

    const HandleReady = useCallback(() => SetStatus("ready"), []);
    const HandleError = useCallback(() => SetStatus("error"), []);

    return (
        <View style={ Style }>
            { Status === "ready" ? null : Fallback }
            { Status === "error" ? null : (
                <View style={ Status === "ready" ? undefined : Styles.PendingHost }>
                    <KatexBlockEquation
                        Expression={ Expression }
                        OnError={ HandleError }
                        OnReady={ HandleReady }
                        // The WebView otherwise claims touches for itself (native
                        // widgets generally do, for their own scroll/interaction
                        // handling), which silently swallows the ancestor
                        // `Pressable` (see `NotionMarkdownBlockEditor.tsx`'s
                        // `RenderRow`) that focuses this block for editing on tap
                        // -- confirmed on-device. `pointerEvents: "none"` makes the
                        // equation purely a display surface, matching every other
                        // blurred block kind's tap-anywhere-to-edit behavior.
                        dom={ { matchContents: true, pointerEvents: "none" } } />
                </View>
            ) }
        </View>
    );
};

const Styles = StyleSheet.create({
    // Keeps the DOM component mounted (so it can render and report back)
    // while clipped to zero visible height -- the WebView's own document
    // still lays out and measures normally; only the native host's visible
    // footprint is suppressed until `Status` flips to "ready".
    PendingHost: {
        height: 0,
        overflow: "hidden",
        width: "100%"
    }
});
