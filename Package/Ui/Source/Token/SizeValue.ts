/**
 * Internal pixel-value resolution for `Token/Size`.  Deliberately NOT
 * re-exported from `Token/index.ts` — apps consume sizes only through
 * `ThemeProvider`'s `useSize()` hook, never as raw numbers keyed by hand.
 *
 * @module @notivex/ui/Token/SizeValue
 * @internal
 *
 * @file      SizeValue.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Size from "./Size.js";

const Value: ReadonlyMap<Size.Size, number> = new Map<Size.Size, number>([
    [ Size.Icon.ExtraSmall, 12 ],
    [ Size.Icon.Small, 16 ],
    [ Size.Icon.Medium, 20 ],
    [ Size.Icon.Large, 24 ],
    [ Size.Icon.ExtraLarge, 32 ],
    [ Size.Control.Small, 32 ],
    [ Size.Control.Medium, 40 ],
    [ Size.Control.Large, 48 ],
    [ Size.TouchTarget.Minimum, 44 ],
    [ Size.Avatar.Small, 24 ],
    [ Size.Avatar.Medium, 32 ],
    [ Size.Avatar.Large, 48 ],
    [ Size.PageIcon.Small, 20 ],
    [ Size.PageIcon.Medium, 28 ],
    [ Size.PageIcon.Large, 40 ],
    [ Size.Checkbox.Default, 18 ],
    [ Size.ListRow.MinimumHeight, 44 ],
    [ Size.Header.Height, 56 ],
    [ Size.BottomNavigation.Height, 56 ],
    [ Size.SheetHandle.Width, 36 ],
    [ Size.SheetHandle.Height, 5 ],
]);

export const Resolve = (Token: Size.Size): number | undefined => Value.get(Token);
