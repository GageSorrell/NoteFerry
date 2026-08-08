/**
 * Internal light/dark value resolution for `Token/Semantic`, ported from
 * `@notion-kit/ui`'s `tooling/tailwind/base.css` (`:root` / `.dark` custom
 * properties).  Not re-exported from `Token/index.ts` — consumed only by
 * `ThemeProvider`.
 *
 * @module @notivex/ui/Token/SemanticValue
 * @internal
 *
 * @file      SemanticValue.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Semantic from "./Semantic.js";

interface LightDark
{
    readonly Light: string;
    readonly Dark: string;
}

const Value: ReadonlyMap<Semantic.Semantic, LightDark> = new Map<Semantic.Semantic, LightDark>([
    /* Accent colors (same in both modes). */
    [
        Semantic.Blue,
        {
            Dark: "rgb(35, 131, 226)",
            Light: "rgb(35, 131, 226)"
        }
    ],
    [
        Semantic.BlueHover,
        {
            Dark: "rgb(0, 119, 212)",
            Light: "rgb(0, 119, 212)"
        }
    ],
    [
        Semantic.Red,
        {
            Dark: "rgb(235, 87, 87)",
            Light: "rgb(235, 87, 87)"
        }
    ],
    [
        Semantic.Orange,
        {
            Dark: "rgb(218, 163, 64)",
            Light: "rgb(218, 163, 64)"
        }
    ],

    /* Text colors. */
    [
        Semantic.Default,
        {
            Dark: "rgb(255, 255, 255)",
            Light: "rgb(50, 48, 44)"
        }
    ],
    [
        Semantic.Primary,
        {
            Dark: "rgb(240, 239, 237)",
            Light: "rgb(44, 44, 43)"
        }
    ],
    [
        Semantic.Secondary,
        {
            Dark: "rgb(168, 164, 156)",
            Light: "rgb(142, 139, 134)"
        }
    ],
    [
        Semantic.Muted,
        {
            Dark: "rgba(255, 255, 255, 0.3)",
            Light: "rgba(70, 68, 64, 0.45)"
        }
    ],
    [
        Semantic.Icon,
        {
            Dark: "rgb(128, 125, 120)",
            Light: "rgb(168, 164, 156)"
        }
    ],
    [
        Semantic.IconPrimary,
        {
            Dark: "#E6E5E3",
            Light: "#383836"
        }
    ],
    [
        Semantic.IconSecondary,
        {
            Dark: "#ADA9A3",
            Light: "#8E8B86"
        }
    ],
    [
        Semantic.MenuIcon,
        {
            Dark: "rgb(230, 229, 227)",
            Light: "rgb(73, 72, 70)"
        }
    ],
    [
        Semantic.TooltipPrimary,
        {
            Dark: "rgb(211, 211, 211)",
            Light: "rgba(255, 255, 255, 0.9)"
        }
    ],
    [
        Semantic.TooltipSecondary,
        {
            Dark: "rgb(127, 127, 127)",
            Light: "rgba(206, 205, 202, 0.6)"
        }
    ],
    [
        Semantic.SidebarPrimary,
        {
            Dark: "rgb(155, 155, 155)",
            Light: "rgb(95, 94, 91)"
        }
    ],

    // Background colors
    [
        Semantic.BackgroundMain,
        {
            Dark: "rgb(25, 25, 25)",
            Light: "rgb(255, 255, 255)"
        }
    ],
    [
        Semantic.BackgroundSidebar,
        {
            Dark: "rgb(32, 32, 32)",
            Light: "rgb(249, 248, 247)"
        }
    ],
    [
        Semantic.BackgroundModal,
        {
            Dark: "rgb(32, 32, 32)",
            Light: "rgb(255, 255, 255)"
        }
    ],
    [
        Semantic.BackgroundPopover,
        {
            Dark: "rgb(37, 37, 37)",
            Light: "rgb(255, 255, 255)"
        }
    ],
    [
        Semantic.BackgroundTooltip,
        {
            Dark: "rgb(47, 47, 47)",
            Light: "rgb(15, 15, 15)"
        }
    ],
    [
        Semantic.BackgroundInput,
        {
            Dark: "rgba(255, 255, 255, 0.055)",
            Light: "rgba(242, 241, 238, 0.6)"
        }
    ],

    /* Border colors. */
    [
        Semantic.Border,
        {
            Dark: "rgba(255, 255, 255, 0.1)",
            Light: "rgba(50, 48, 44, 0.1)"
        }
    ],
    [
        Semantic.BorderButton,
        {
            Dark: "rgba(255, 255, 255, 0.15)",
            Light: "rgba(50, 48, 44, 0.15)"
        }
    ],
    [
        Semantic.BorderCell,
        {
            Dark: "rgb(47, 47, 47)",
            Light: "rgb(233, 233, 231)"
        }
    ],
    [
        Semantic.Ring,
        {
            Dark: "rgba(255, 255, 255, 0.075)",
            Light: "rgba(15, 15, 15, 0.1)"
        }
    ]
]);

export/**
       * Resolve a `Semantic` token.
       *
       * @category Token
       * @since 1.0.0
       */
const Resolve = (Token: Semantic.Semantic, Mode: "Light" | "Dark"): string | undefined =>
    Value.get(Token)?.[Mode];
