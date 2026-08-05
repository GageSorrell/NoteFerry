/**
 *
 *
 * @module @notivex/ui/Token/Size
 *
 * @file      Size.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";

const TypeId = "~notivex/ui/Token/Size" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export const Small: unique symbol = Symbol.for(GetSymbolKey("Small"));

export type Small = typeof Small;

export const Medium: unique symbol = Symbol.for(GetSymbolKey("Medium"));

export type Medium = typeof Medium;

export const Large: unique symbol = Symbol.for(GetSymbolKey("Large"));

export type Large = typeof Large;

export type Size =
    | Small
    | Medium
    | Large;
