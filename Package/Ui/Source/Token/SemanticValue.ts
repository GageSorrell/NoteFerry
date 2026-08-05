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
    [ Semantic.Blue, { Light: "rgb(35, 131, 226)", Dark: "rgb(35, 131, 226)" } ],
    [ Semantic.BlueHover, { Light: "rgb(0, 119, 212)", Dark: "rgb(0, 119, 212)" } ],
    [ Semantic.Red, { Light: "rgb(235, 87, 87)", Dark: "rgb(235, 87, 87)" } ],
    [ Semantic.Orange, { Light: "rgb(218, 163, 64)", Dark: "rgb(218, 163, 64)" } ],

    /* Text colors. */
    [ Semantic.Default, { Light: "rgb(50, 48, 44)", Dark: "rgb(255, 255, 255)" } ],
    [ Semantic.Primary, { Light: "rgb(44, 44, 43)", Dark: "rgb(240, 239, 237)" } ],
    [ Semantic.Secondary, { Light: "rgb(142, 139, 134)", Dark: "rgb(168, 164, 156)" } ],
    [ Semantic.Muted, { Light: "rgba(70, 68, 64, 0.45)", Dark: "rgba(255, 255, 255, 0.3)" } ],
    [ Semantic.Icon, { Light: "rgb(168, 164, 156)", Dark: "rgb(128, 125, 120)" } ],
    [ Semantic.IconPrimary, { Light: "#383836", Dark: "#E6E5E3" } ],
    [ Semantic.IconSecondary, { Light: "#8E8B86", Dark: "#ADA9A3" } ],
    [ Semantic.MenuIcon, { Light: "rgb(73, 72, 70)", Dark: "rgb(230, 229, 227)" } ],
    [ Semantic.TooltipPrimary, { Light: "rgba(255, 255, 255, 0.9)", Dark: "rgb(211, 211, 211)" } ],
    [ Semantic.TooltipSecondary, { Light: "rgba(206, 205, 202, 0.6)", Dark: "rgb(127, 127, 127)" } ],
    [ Semantic.SidebarPrimary, { Light: "rgb(95, 94, 91)", Dark: "rgb(155, 155, 155)" } ],

    // Background colors
    [ Semantic.BackgroundMain, { Light: "rgb(255, 255, 255)", Dark: "rgb(25, 25, 25)" } ],
    [ Semantic.BackgroundSidebar, { Light: "rgb(249, 248, 247)", Dark: "rgb(32, 32, 32)" } ],
    [ Semantic.BackgroundModal, { Light: "rgb(255, 255, 255)", Dark: "rgb(32, 32, 32)" } ],
    [ Semantic.BackgroundPopover, { Light: "rgb(255, 255, 255)", Dark: "rgb(37, 37, 37)" } ],
    [ Semantic.BackgroundTooltip, { Light: "rgb(15, 15, 15)", Dark: "rgb(47, 47, 47)" } ],
    [ Semantic.BackgroundInput, { Light: "rgba(242, 241, 238, 0.6)", Dark: "rgba(255, 255, 255, 0.055)" } ],

    /* Border colors. */
    [ Semantic.Border, { Light: "rgba(50, 48, 44, 0.1)", Dark: "rgba(255, 255, 255, 0.1)" } ],
    [ Semantic.BorderButton, { Light: "rgba(50, 48, 44, 0.15)", Dark: "rgba(255, 255, 255, 0.15)" } ],
    [ Semantic.BorderCell, { Light: "rgb(233, 233, 231)", Dark: "rgb(47, 47, 47)" } ],
    [ Semantic.Ring, { Light: "rgba(15, 15, 15, 0.1)", Dark: "rgba(255, 255, 255, 0.075)" } ],
]);

export const Resolve = (Token: Semantic.Semantic, Mode: "Light" | "Dark"): string | undefined =>
    Value.get(Token)?.[Mode];
