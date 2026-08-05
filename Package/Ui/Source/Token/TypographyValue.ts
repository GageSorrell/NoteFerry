/**
 * Internal `{FontSize, LineHeight, FontWeight}` resolution for
 * `Token/Typography`, ported from `@notion-kit/ui`'s `typographyVariants`
 * cva (Tailwind ratios pre-computed to numeric RN line-heights).  Not
 * re-exported from `Token/index.ts` — consumed only by `ThemeProvider`.
 *
 * @module @notivex/ui/Token/TypographyValue
 * @internal
 *
 * @file      TypographyValue.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Typography from "./Typography.js";

export type FontWeight =
    | "400"
    | "500"
    | "600"
    | "700";

export interface TypographyValue
{
    readonly FontSize: number;
    readonly LineHeight: number;
    readonly FontWeight: FontWeight;
}

const Value: ReadonlyMap<Typography.Typography, TypographyValue> = new Map<Typography.Typography, TypographyValue>([
    [ Typography.Heading1, { FontSize: 40, LineHeight: 48, FontWeight: "700" } ],
    [ Typography.Heading2, { FontSize: 18, LineHeight: 22, FontWeight: "600" } ],
    [ Typography.Heading3, { FontSize: 14, LineHeight: 20, FontWeight: "600" } ],
    [ Typography.Body, { FontSize: 14, LineHeight: 20, FontWeight: "400" } ],
    [ Typography.Label, { FontSize: 12, LineHeight: 18, FontWeight: "500" } ],
    [ Typography.Description, { FontSize: 12, LineHeight: 16, FontWeight: "400" } ],
]);

export const Resolve = (Token: Typography.Typography): TypographyValue | undefined => Value.get(Token);
