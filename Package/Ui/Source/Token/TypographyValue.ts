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

/**
 * The font weight (of some text).
 *
 * @category Typography
 * @since 1.0.0
 */
export type FontWeight =
    | "400"
    | "500"
    | "600"
    | "700";

/**
 * The collection of style properties used to style text in `@notivex/ui`.
 *
 * @category Typography
 * @since 1.0.0
 */
export interface TypographyValue
{
    readonly FontSize: number;
    readonly FontWeight: FontWeight;
    readonly LineHeight: number;
}

const Value = Object.freeze({
    [ Typography.Heading1 ]:
    {
        FontSize: 40,
        FontWeight: "700",
        LineHeight: 48
    },
    [ Typography.Heading2 ]:
    {
        FontSize: 18,
        FontWeight: "600",
        LineHeight: 22
    },
    [ Typography.Heading3 ]:
    {
        FontSize: 14,
        FontWeight: "600",
        LineHeight: 20
    },
    [ Typography.Body ]:
    {
        FontSize: 14,
        FontWeight: "400",
        LineHeight: 20
    },
    [ Typography.Label ]:
    {
        FontSize: 12,
        FontWeight: "500",
        LineHeight: 18
    },
    [ Typography.Description ]:
    {
        FontSize: 12,
        FontWeight: "400",
        LineHeight: 16
    }
} as const);

export/**
       * Resolve a `Typography` token to its value.
       *
       * @internal
       * @since 1.0.0
       */
const Resolve =
    (Token: Typography.Typography): TypographyValue | undefined => Value[Token];
