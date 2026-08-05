/**
 * Corner-radius tokens, reconciled from `@notion-kit/ui`'s `--radius` scale
 * (`--radius: 0.5rem` with `sm/md/lg/xl` derived at ±4px steps).
 *
 * @module @notivex/ui/Token/Radii
 *
 * @file      Radii.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";

const TypeId = "~notivex/ui/Token/Radii" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export const None: unique symbol = Symbol.for(GetSymbolKey("None"));

export type None = typeof None;

export const Small: unique symbol = Symbol.for(GetSymbolKey("Small"));

export type Small = typeof Small;

export const Medium: unique symbol = Symbol.for(GetSymbolKey("Medium"));

export type Medium = typeof Medium;

export const Large: unique symbol = Symbol.for(GetSymbolKey("Large"));

export type Large = typeof Large;

export const ExtraLarge: unique symbol = Symbol.for(GetSymbolKey("ExtraLarge"));

export type ExtraLarge = typeof ExtraLarge;

export const Full: unique symbol = Symbol.for(GetSymbolKey("Full"));

export type Full = typeof Full;

export type Radii =
    | None
    | Small
    | Medium
    | Large
    | ExtraLarge
    | Full;
