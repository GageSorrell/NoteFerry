/**
 * Semantic UI-chrome color tokens — text/background/border *roles*, distinct
 * from `Token/Color`'s tag/select palette.  These resolve to different
 * values in light vs. dark mode (see the value table below), whereas
 * `Token/Color` is theme-invariant.
 *
 * @module @notivex/ui/Token/Semantic
 *
 * @file      Semantic.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";
import type { ReadonlyRecord } from "effect/Record";

const TypeId = "~notivex/ui/Token/Semantic" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export/**
       * The primary blue accent color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Blue: unique symbol = Symbol.for(GetSymbolKey("Blue"));

/** {@inheritDoc Blue} */
export type Blue = typeof Blue;

export/**
       * The hovered or pressed blue accent color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BlueHover: unique symbol = Symbol.for(GetSymbolKey("BlueHover"));

/** {@inheritDoc BlueHover} */
export type BlueHover = typeof BlueHover;

export/**
       * The destructive and error accent color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Red: unique symbol = Symbol.for(GetSymbolKey("Red"));

/** {@inheritDoc Red} */
export type Red = typeof Red;

export/**
       * The warning accent color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Orange: unique symbol = Symbol.for(GetSymbolKey("Orange"));

/** {@inheritDoc Orange} */
export type Orange = typeof Orange;

// Text colors

export/**
       * The default foreground color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Default: unique symbol = Symbol.for(GetSymbolKey("Default"));

/** {@inheritDoc Default} */
export type Default = typeof Default;

export/**
       * The primary text color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Primary: unique symbol = Symbol.for(GetSymbolKey("Primary"));

/** {@inheritDoc Primary} */
export type Primary = typeof Primary;

export/**
       * The secondary text color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Secondary: unique symbol = Symbol.for(GetSymbolKey("Secondary"));

/** {@inheritDoc Secondary} */
export type Secondary = typeof Secondary;

export/**
       * The subdued text and control color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Muted: unique symbol = Symbol.for(GetSymbolKey("Muted"));

/** {@inheritDoc Muted} */
export type Muted = typeof Muted;

export/**
       * The insertion cursor and text-selection accent color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Cursor: unique symbol = Symbol.for(GetSymbolKey("Cursor"));

/** {@inheritDoc Cursor} */
export type Cursor = typeof Cursor;

export/**
       * The default icon color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Icon: unique symbol = Symbol.for(GetSymbolKey("Icon"));

/** {@inheritDoc Icon} */
export type Icon = typeof Icon;

export/**
       * The primary-emphasis icon color token.
       *
       * @category Token
       * @since 1.0.0
       */
const IconPrimary: unique symbol = Symbol.for(GetSymbolKey("IconPrimary"));

/** {@inheritDoc IconPrimary} */
export type IconPrimary = typeof IconPrimary;

export/**
       * The secondary-emphasis icon color token.
       *
       * @category Token
       * @since 1.0.0
       */
const IconSecondary: unique symbol = Symbol.for(GetSymbolKey("IconSecondary"));

/** {@inheritDoc IconSecondary} */
export type IconSecondary = typeof IconSecondary;

export/**
       * The icon color token used in menus.
       *
       * @category Token
       * @since 1.0.0
       */
const MenuIcon: unique symbol = Symbol.for(GetSymbolKey("MenuIcon"));

/** {@inheritDoc MenuIcon} */
export type MenuIcon = typeof MenuIcon;

export/**
       * The primary tooltip foreground color token.
       *
       * @category Token
       * @since 1.0.0
       */
const TooltipPrimary: unique symbol = Symbol.for(GetSymbolKey("TooltipPrimary"));

/** {@inheritDoc TooltipPrimary} */
export type TooltipPrimary = typeof TooltipPrimary;

export/**
       * The secondary tooltip foreground color token.
       *
       * @category Token
       * @since 1.0.0
       */
const TooltipSecondary: unique symbol = Symbol.for(GetSymbolKey("TooltipSecondary"));

/** {@inheritDoc TooltipSecondary} */
export type TooltipSecondary = typeof TooltipSecondary;

export/**
       * The primary sidebar foreground color token.
       *
       * @category Token
       * @since 1.0.0
       */
const SidebarPrimary: unique symbol = Symbol.for(GetSymbolKey("SidebarPrimary"));

/** {@inheritDoc SidebarPrimary} */
export type SidebarPrimary = typeof SidebarPrimary;

export/**
       * The main application background color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BackgroundMain: unique symbol = Symbol.for(GetSymbolKey("BackgroundMain"));

/** {@inheritDoc BackgroundMain} */
export type BackgroundMain = typeof BackgroundMain;

export/**
       * The sidebar background color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BackgroundSidebar: unique symbol = Symbol.for(GetSymbolKey("BackgroundSidebar"));

/** {@inheritDoc BackgroundSidebar} */
export type BackgroundSidebar = typeof BackgroundSidebar;

export/**
       * The modal and dialog background color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BackgroundModal: unique symbol = Symbol.for(GetSymbolKey("BackgroundModal"));

/** {@inheritDoc BackgroundModal} */
export type BackgroundModal = typeof BackgroundModal;

export/**
       * The popover background color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BackgroundPopover: unique symbol = Symbol.for(GetSymbolKey("BackgroundPopover"));

/** {@inheritDoc BackgroundPopover} */
export type BackgroundPopover = typeof BackgroundPopover;

export/**
       * The tooltip background color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BackgroundTooltip: unique symbol = Symbol.for(GetSymbolKey("BackgroundTooltip"));

/** {@inheritDoc BackgroundTooltip} */
export type BackgroundTooltip = typeof BackgroundTooltip;

export/**
       * The text-input background color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BackgroundInput: unique symbol = Symbol.for(GetSymbolKey("BackgroundInput"));

/** {@inheritDoc BackgroundInput} */
export type BackgroundInput = typeof BackgroundInput;

// Border colors

export/**
       * The default subtle border color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Border: unique symbol = Symbol.for(GetSymbolKey("Border"));

/** {@inheritDoc Border} */
export type Border = typeof Border;

export/**
       * The button-border color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BorderButton: unique symbol = Symbol.for(GetSymbolKey("BorderButton"));

/** {@inheritDoc BorderButton} */
export type BorderButton = typeof BorderButton;

export/**
       * The table and database cell-border color token.
       *
       * @category Token
       * @since 1.0.0
       */
const BorderCell: unique symbol = Symbol.for(GetSymbolKey("BorderCell"));

/** {@inheritDoc BorderCell} */
export type BorderCell = typeof BorderCell;

export/**
       * The focus-ring color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Ring: unique symbol = Symbol.for(GetSymbolKey("Ring"));

/** {@inheritDoc Ring} */
export type Ring = typeof Ring;

/**
 * Any theme-aware semantic color token.
 *
 * @category Token
 * @since 1.0.0
 */
export type Semantic =
    | Blue
    | BlueHover
    | Red
    | Orange
    | Default
    | Primary
    | Secondary
    | Muted
    | Cursor
    | Icon
    | IconPrimary
    | IconSecondary
    | MenuIcon
    | TooltipPrimary
    | TooltipSecondary
    | SidebarPrimary
    | BackgroundMain
    | BackgroundSidebar
    | BackgroundModal
    | BackgroundPopover
    | BackgroundTooltip
    | BackgroundInput
    | Border
    | BorderButton
    | BorderCell
    | Ring;

interface LightDark
{
    readonly Light: string;
    readonly Dark: string;
}

/* Group values by their semantic role instead of alphabetically. */
/* eslint-disable sort-keys */
const Value: ReadonlyRecord<Semantic, LightDark> = Object.freeze({
    /* Accent colors (same in both modes). */
    [ Blue ]:
    {
        Dark: "rgb(35, 131, 226)",
        Light: "rgb(35, 131, 226)"
    },
    [ BlueHover ]:
    {
        Dark: "rgb(0, 119, 212)",
        Light: "rgb(0, 119, 212)"
    },
    [ Red ]:
    {
        Dark: "rgb(235, 87, 87)",
        Light: "rgb(235, 87, 87)"
    },
    [ Orange ]:
    {
        Dark: "rgb(218, 163, 64)",
        Light: "rgb(218, 163, 64)"
    },

    /* Text colors. */
    [ Default ]:
    {
        Dark: "rgb(255, 255, 255)",
        Light: "rgb(50, 48, 44)"
    },
    [ Primary ]:
    {
        Dark: "rgb(240, 239, 237)",
        Light: "rgb(44, 44, 43)"
    },
    [ Secondary ]:
    {
        Dark: "rgb(168, 164, 156)",
        Light: "rgb(142, 139, 134)"
    },
    [ Muted ]:
    {
        Dark: "rgba(255, 255, 255, 0.3)",
        Light: "rgba(70, 68, 64, 0.45)"
    },
    [ Cursor ]:
    {
        Dark: "#ADA9A3",
        Light: "#8E8B86"
    },
    [ Icon ]:
    {
        Dark: "rgb(128, 125, 120)",
        Light: "rgb(168, 164, 156)"
    },
    [ IconPrimary ]:
    {
        Dark: "#E6E5E3",
        Light: "#383836"
    },
    [ IconSecondary ]:
    {
        Dark: "#ADA9A3",
        Light: "#8E8B86"
    },
    [ MenuIcon ]:
    {
        Dark: "rgb(230, 229, 227)",
        Light: "rgb(73, 72, 70)"
    },
    [ TooltipPrimary ]:
    {
        Dark: "rgb(211, 211, 211)",
        Light: "rgba(255, 255, 255, 0.9)"
    },
    [ TooltipSecondary ]:
    {
        Dark: "rgb(127, 127, 127)",
        Light: "rgba(206, 205, 202, 0.6)"
    },
    [ SidebarPrimary ]:
    {
        Dark: "rgb(155, 155, 155)",
        Light: "rgb(95, 94, 91)"
    },

    // Background colors
    [ BackgroundMain ]:
    {
        Dark: "rgb(25, 25, 25)",
        Light: "rgb(255, 255, 255)"
    },
    [ BackgroundSidebar ]:
    {
        Dark: "rgb(32, 32, 32)",
        Light: "rgb(249, 248, 247)"
    },
    [ BackgroundModal ]:
    {
        Dark: "rgb(32, 32, 32)",
        Light: "rgb(255, 255, 255)"
    },
    [ BackgroundPopover ]:
    {
        Dark: "rgb(37, 37, 37)",
        Light: "rgb(255, 255, 255)"
    },
    [ BackgroundTooltip ]:
    {
        Dark: "rgb(47, 47, 47)",
        Light: "rgb(15, 15, 15)"
    },
    [ BackgroundInput ]:
    {
        Dark: "rgba(255, 255, 255, 0.055)",
        Light: "rgba(242, 241, 238, 0.6)"
    },

    /* Border colors. */
    [ Border ]:
    {
        Dark: "rgba(255, 255, 255, 0.1)",
        Light: "rgba(50, 48, 44, 0.1)"
    },
    [ BorderButton ]:
    {
        Dark: "rgba(255, 255, 255, 0.15)",
        Light: "rgba(50, 48, 44, 0.15)"
    },
    [ BorderCell ]:
    {
        Dark: "rgb(47, 47, 47)",
        Light: "rgb(233, 233, 231)"
    },
    [ Ring ]:
    {
        Dark: "rgba(255, 255, 255, 0.075)",
        Light: "rgba(15, 15, 15, 0.1)"
    }
} as const);
/* eslint-enable sort-keys */

export/**
       * Resolve a `Semantic` token.
       *
       * @internal
       * @category Token
       * @since 1.0.0
       */
const Resolve = (Token: Semantic, Mode: "Light" | "Dark"): string | undefined =>
    Value[Token]?.[Mode];
