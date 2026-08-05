/**
 * Spacing tokens — how much empty space, not how large a thing is (see
 * `Token/Size` for that).  A flat numeric scale plus semantic aliases for
 * the handful of spacing decisions that recur across the whole library.
 *
 * @module @notivex/ui/Token/Spacing
 *
 * @file      Spacing.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";

const TypeId = "~notivex/ui/Token/Spacing" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export const None: unique symbol = Symbol.for(GetSymbolKey("None"));

export type None = typeof None;

export const ExtraSmall: unique symbol = Symbol.for(GetSymbolKey("ExtraSmall"));

export type ExtraSmall = typeof ExtraSmall;

export const Small: unique symbol = Symbol.for(GetSymbolKey("Small"));

export type Small = typeof Small;

export const Medium: unique symbol = Symbol.for(GetSymbolKey("Medium"));

export type Medium = typeof Medium;

export const Large: unique symbol = Symbol.for(GetSymbolKey("Large"));

export type Large = typeof Large;

export const ExtraLarge: unique symbol = Symbol.for(GetSymbolKey("ExtraLarge"));

export type ExtraLarge = typeof ExtraLarge;

export const DoubleExtraLarge: unique symbol = Symbol.for(GetSymbolKey("DoubleExtraLarge"));

export type DoubleExtraLarge = typeof DoubleExtraLarge;

export const ScreenHorizontal: unique symbol = Symbol.for(GetSymbolKey("ScreenHorizontal"));

export type ScreenHorizontal = typeof ScreenHorizontal;

export const ScreenVertical: unique symbol = Symbol.for(GetSymbolKey("ScreenVertical"));

export type ScreenVertical = typeof ScreenVertical;

export const SectionGap: unique symbol = Symbol.for(GetSymbolKey("SectionGap"));

export type SectionGap = typeof SectionGap;

export const GroupGap: unique symbol = Symbol.for(GetSymbolKey("GroupGap"));

export type GroupGap = typeof GroupGap;

export const RowHorizontal: unique symbol = Symbol.for(GetSymbolKey("RowHorizontal"));

export type RowHorizontal = typeof RowHorizontal;

export const RowVertical: unique symbol = Symbol.for(GetSymbolKey("RowVertical"));

export type RowVertical = typeof RowVertical;

export const ControlGap: unique symbol = Symbol.for(GetSymbolKey("ControlGap"));

export type ControlGap = typeof ControlGap;

export const IconTextGap: unique symbol = Symbol.for(GetSymbolKey("IconTextGap"));

export type IconTextGap = typeof IconTextGap;

export const InlineGap: unique symbol = Symbol.for(GetSymbolKey("InlineGap"));

export type InlineGap = typeof InlineGap;

export const SheetHorizontal: unique symbol = Symbol.for(GetSymbolKey("SheetHorizontal"));

export type SheetHorizontal = typeof SheetHorizontal;

export const SheetVertical: unique symbol = Symbol.for(GetSymbolKey("SheetVertical"));

export type SheetVertical = typeof SheetVertical;

export type Spacing =
    | None
    | ExtraSmall
    | Small
    | Medium
    | Large
    | ExtraLarge
    | DoubleExtraLarge
    | ScreenHorizontal
    | ScreenVertical
    | SectionGap
    | GroupGap
    | RowHorizontal
    | RowVertical
    | ControlGap
    | IconTextGap
    | InlineGap
    | SheetHorizontal
    | SheetVertical;
