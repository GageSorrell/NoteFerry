/**
 * Semantic UI-chrome color tokens — text/background/border *roles*, distinct
 * from `Token/Color`'s tag/select palette.  These resolve to different
 * values in light vs. dark mode (see `SemanticValue.ts`), whereas
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

const TypeId = "~notivex/ui/Token/Semantic" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

// Accent colors

export const Blue: unique symbol = Symbol.for(GetSymbolKey("Blue"));
export type Blue = typeof Blue;

export const BlueHover: unique symbol = Symbol.for(GetSymbolKey("BlueHover"));
export type BlueHover = typeof BlueHover;

export const Red: unique symbol = Symbol.for(GetSymbolKey("Red"));
export type Red = typeof Red;

export const Orange: unique symbol = Symbol.for(GetSymbolKey("Orange"));
export type Orange = typeof Orange;

// Text colors

export const Default: unique symbol = Symbol.for(GetSymbolKey("Default"));
export type Default = typeof Default;

export const Primary: unique symbol = Symbol.for(GetSymbolKey("Primary"));
export type Primary = typeof Primary;

export const Secondary: unique symbol = Symbol.for(GetSymbolKey("Secondary"));
export type Secondary = typeof Secondary;

export const Muted: unique symbol = Symbol.for(GetSymbolKey("Muted"));
export type Muted = typeof Muted;

export const Icon: unique symbol = Symbol.for(GetSymbolKey("Icon"));
export type Icon = typeof Icon;

export const IconPrimary: unique symbol = Symbol.for(GetSymbolKey("IconPrimary"));
export type IconPrimary = typeof IconPrimary;

export const IconSecondary: unique symbol = Symbol.for(GetSymbolKey("IconSecondary"));
export type IconSecondary = typeof IconSecondary;

export const MenuIcon: unique symbol = Symbol.for(GetSymbolKey("MenuIcon"));
export type MenuIcon = typeof MenuIcon;

export const TooltipPrimary: unique symbol = Symbol.for(GetSymbolKey("TooltipPrimary"));
export type TooltipPrimary = typeof TooltipPrimary;

export const TooltipSecondary: unique symbol = Symbol.for(GetSymbolKey("TooltipSecondary"));
export type TooltipSecondary = typeof TooltipSecondary;

export const SidebarPrimary: unique symbol = Symbol.for(GetSymbolKey("SidebarPrimary"));
export type SidebarPrimary = typeof SidebarPrimary;

// Background colors

export const BackgroundMain: unique symbol = Symbol.for(GetSymbolKey("BackgroundMain"));
export type BackgroundMain = typeof BackgroundMain;

export const BackgroundSidebar: unique symbol = Symbol.for(GetSymbolKey("BackgroundSidebar"));
export type BackgroundSidebar = typeof BackgroundSidebar;

export const BackgroundModal: unique symbol = Symbol.for(GetSymbolKey("BackgroundModal"));
export type BackgroundModal = typeof BackgroundModal;

export const BackgroundPopover: unique symbol = Symbol.for(GetSymbolKey("BackgroundPopover"));
export type BackgroundPopover = typeof BackgroundPopover;

export const BackgroundTooltip: unique symbol = Symbol.for(GetSymbolKey("BackgroundTooltip"));
export type BackgroundTooltip = typeof BackgroundTooltip;

export const BackgroundInput: unique symbol = Symbol.for(GetSymbolKey("BackgroundInput"));
export type BackgroundInput = typeof BackgroundInput;

// Border colors

export const Border: unique symbol = Symbol.for(GetSymbolKey("Border"));
export type Border = typeof Border;

export const BorderButton: unique symbol = Symbol.for(GetSymbolKey("BorderButton"));
export type BorderButton = typeof BorderButton;

export const BorderCell: unique symbol = Symbol.for(GetSymbolKey("BorderCell"));
export type BorderCell = typeof BorderCell;

export const Ring: unique symbol = Symbol.for(GetSymbolKey("Ring"));
export type Ring = typeof Ring;

export type Semantic =
    | Blue
    | BlueHover
    | Red
    | Orange
    | Default
    | Primary
    | Secondary
    | Muted
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
