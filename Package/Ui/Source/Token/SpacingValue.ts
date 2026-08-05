/**
 * Internal pixel-value resolution for `Token/Spacing`.  Not re-exported
 * from `Token/index.ts` — consumed only by `ThemeProvider`.
 *
 * @module @notivex/ui/Token/SpacingValue
 * @internal
 *
 * @file      SpacingValue.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Spacing from "./Spacing.js";

const Scale =
    Object.freeze({
        None: 0,
        ExtraSmall: 4,
        Small: 8,
        Medium: 12,
        Large: 16,
        ExtraLarge: 24,
        DoubleExtraLarge: 32,
    } as const);

const Value: ReadonlyMap<Spacing.Spacing, number> = new Map<Spacing.Spacing, number>([
    [ Spacing.None, Scale.None ],
    [ Spacing.ExtraSmall, Scale.ExtraSmall ],
    [ Spacing.Small, Scale.Small ],
    [ Spacing.Medium, Scale.Medium ],
    [ Spacing.Large, Scale.Large ],
    [ Spacing.ExtraLarge, Scale.ExtraLarge ],
    [ Spacing.DoubleExtraLarge, Scale.DoubleExtraLarge ],
    [ Spacing.ScreenHorizontal, Scale.Medium ],
    [ Spacing.ScreenVertical, Scale.Medium ],
    [ Spacing.SectionGap, Scale.ExtraLarge ],
    [ Spacing.GroupGap, Scale.Large ],
    [ Spacing.RowHorizontal, Scale.Medium ],
    [ Spacing.RowVertical, Scale.Small ],
    [ Spacing.ControlGap, Scale.Small ],
    [ Spacing.IconTextGap, Scale.ExtraSmall ],
    [ Spacing.InlineGap, Scale.ExtraSmall ],
    [ Spacing.SheetHorizontal, Scale.Medium ],
    [ Spacing.SheetVertical, Scale.Medium ],
]);

export const Resolve = (Token: Spacing.Spacing): number | undefined => Value.get(Token);
