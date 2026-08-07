/**
 *
 *
 * @module @notivex/ui
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

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
export * as Token from "./Token/index.js";

export {
    ThemeProvider,
    type ThemeProviderProps,
    UseTheme as useTheme,
    UseColor as useColor,
    useSize,
    useSpacing,
    useRadii,
    useTypography,
    useShadow
} from "./ThemeProvider.js";
