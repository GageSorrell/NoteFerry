/**
 * Lightweight styling and theming entry point for `@noteferry/ui`.
 *
 * Unlike the package root, this module deliberately does not re-export the
 * Primitive or Block barrels. Mobile screens import this entry point during
 * startup so Metro does not traverse every UI component just to resolve theme
 * tokens or style helpers.
 *
 * @module @noteferry/ui/Core
 *
 * @file      Core.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** Public nominal token values and types, grouped by token category. */
export * as Token from "./Token/index.js";

export {
    ImageStyle,
    type ImageStyleSlot,
    MakeStyles,
    MergeStyles,
    type ColorToken,
    type NumberToken,
    type ResolvedStyles,
    type Style,
    type StyleSlot,
    type StyleToken,
    type StylesConfig,
    TextStyle,
    type TextStyleSlot,
    type Tokenized,
    ViewStyle,
    type ViewStyleSlot
} from "./MakeStyles.js";

export {
    ThemeProvider,
    type ThemeProviderProps,
    useToken,
    useTheme,
    type Theme,
    type ThemeMode,
    type ResolvableToken,
    type ResolvedTokenRecord,
    type ResolvedTokenValue,
    type ResolvedTheme,
    type ResolvedColorTokens,
    type ResolvedRadiiTokens,
    type ResolvedSemanticTokens,
    type ResolvedShadowTokens,
    type ResolvedSizeTokens,
    type ResolvedSpacingTokens,
    type ResolvedTypographyTokens
} from "./ThemeProvider.js";
