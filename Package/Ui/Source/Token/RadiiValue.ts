/**
 * Internal pixel-value resolution for `Token/Radii`.  Not re-exported from
 * `Token/index.ts` — consumed only by `ThemeProvider`.
 *
 * @module @notivex/ui/Token/RadiiValue
 * @internal
 *
 * @file      RadiiValue.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "./Radii.js";

const Value: ReadonlyMap<Radii.Radii, number> = new Map<Radii.Radii, number>([
    [ Radii.None, 0 ],
    [ Radii.Small, 4 ],
    [ Radii.Medium, 8 ],
    [ Radii.Large, 10 ],
    [ Radii.ExtraLarge, 12 ],
    [ Radii.Full, 9999 ],
]);

export const Resolve = (Token: Radii.Radii): number | undefined => Value.get(Token);
