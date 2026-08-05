/**
 * Internal RN-style-object resolution for `Token/Shadow`.  RN has no
 * multi-layer CSS box-shadow, so these are approximations of
 * `@notion-kit/ui`'s `--shadow-notion` (focus ring) and `--shadow-out-md`
 * (card) — not pixel-identical to the source. Not re-exported from
 * `Token/index.ts` — consumed only by `ThemeProvider`.
 *
 * @module @notivex/ui/Token/ShadowValue
 * @internal
 *
 * @file      ShadowValue.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Shadow from "./Shadow.js";

export interface ShadowValue
{
    readonly BorderWidth?: number;
    readonly BorderColor?: string;
    readonly ShadowColor?: string;
    readonly ShadowOffset?:
    {
        readonly Height: number
        readonly Width: number;
    };
    readonly ShadowOpacity?: number;
    readonly ShadowRadius?: number;
    readonly Elevation?: number;
}

const Value: ReadonlyMap<Shadow.Shadow, ShadowValue> = new Map<Shadow.Shadow, ShadowValue>([
    [
        Shadow.FocusRing,
        {
            BorderWidth: 2,
            BorderColor: "rgba(35, 131, 226, 0.35)",
        }
    ],
    [
        Shadow.Card,
        {
            ShadowColor: "#191919",
            ShadowOffset:
            {
                Height: 2,
                Width: 0
            },
            ShadowOpacity: 0.07,
            ShadowRadius: 6,
            Elevation: 2,
        }
    ]
]);

export const Resolve = (Token: Shadow.Shadow): ShadowValue | undefined => Value.get(Token);
