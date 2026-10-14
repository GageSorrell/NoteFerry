/**
 * The app's real math-typesetting `EquationRenderer`, injected into
 * `NotionMarkdownText`/`NotionMarkdownBlockEditor` from
 * `@noteferry/react-native-notion-markdown` (see `EquationViewProps.Renderer`
 * in that package). Composes `BlockEquationRenderer` (live KaTeX in a
 * WebView) and `InlineEquationRenderer` (rasterized PNG, since inline
 * equations can't host a live WebView inside a `Text` tree) behind the
 * package's `Inline` switch. Must be used within an
 * `EquationRasterizerProvider` (only the inline path actually needs it, but
 * both share one composed component here for simplicity).
 *
 * @module noteferry/Component/Equation/EquationRenderer
 *
 * @file      EquationRenderer.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { TextStyle, ViewStyle } from "react-native";
import type { EquationRendererProps } from "@noteferry/react-native-notion-markdown";
import { BlockEquationRenderer } from "./BlockEquationRenderer";
import { InlineEquationRenderer } from "./InlineEquationRenderer";

export/**
       * Real KaTeX equation rendering, dispatching to the inline
       * (rasterized-image) or block (live WebView) implementation.
       *
       * @category Components
       * @since 1.0.0
       */
const EquationRenderer = ({ Expression, Inline, Style, Fallback }: EquationRendererProps): React.JSX.Element =>
{
    if (Inline)
    {
        return <InlineEquationRenderer Expression={ Expression } Fallback={ Fallback } Style={ Style as TextStyle | undefined } />;
    }
    return <BlockEquationRenderer Expression={ Expression } Fallback={ Fallback } Style={ Style as ViewStyle | undefined } />;
};
