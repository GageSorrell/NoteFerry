/**
 * Internal hex-value resolution for `Token/Color` — Notion's 10-color
 * tag/select palette, ported verbatim from `@notion-kit/ui`'s
 * `src/colors/index.ts`.  These are theme-invariant (same hex in light and
 * dark mode).  Not re-exported from `Token/index.ts` — consumed only by
 * `ThemeProvider`.
 *
 * @module @notivex/ui/Token/ColorValue
 * @internal
 *
 * @file      ColorValue.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Color from "./Color.js";

const Value: ReadonlyMap<Color.Color, string> = new Map<Color.Color, string>([
    [ Color.Default, "#55534E" ],
    [ Color.Gray, "#A6A299" ],
    [ Color.Brown, "#9F6B53" ],
    [ Color.Orange, "#D9730D" ],
    [ Color.Yellow, "#CB912F" ],
    [ Color.Green, "#448361" ],
    [ Color.Blue, "#337EA9" ],
    [ Color.Purple, "#9065B0" ],
    [ Color.Pink, "#C14C8A" ],
    [ Color.Red, "#D44C47" ],
]);

export const Resolve = (Token: Color.Color): string | undefined => Value.get(Token);
