/**
 * Public entry point for `@notivex/ui`.
 *
 * @module @notivex/ui
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export * as Primitive from "./Primitive/index.js";

/** Public nominal token values and types, grouped by token category. */
export * as Token from "./Token/index.js";

export { NotivexUiError } from "./NotivexUiError.js";

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
