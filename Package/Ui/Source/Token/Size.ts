/**
 * Namespaced semantic size tokens.  Unlike `Spacing` (empty space), `Size`
 * answers "how large is the thing itself" — a flat `Small | Medium | Large`
 * is meaningless without knowing what it's sizing, so every leaf lives under
 * a named category (`Size.Icon.Medium`, `Size.Control.Large`, ...).
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

export namespace Icon
{
    export const ExtraSmall: unique symbol = Symbol.for(GetSymbolKey("Icon.ExtraSmall"));
    export type ExtraSmall = typeof ExtraSmall;

    export const Small: unique symbol = Symbol.for(GetSymbolKey("Icon.Small"));
    export type Small = typeof Small;

    export const Medium: unique symbol = Symbol.for(GetSymbolKey("Icon.Medium"));
    export type Medium = typeof Medium;

    export const Large: unique symbol = Symbol.for(GetSymbolKey("Icon.Large"));
    export type Large = typeof Large;

    export const ExtraLarge: unique symbol = Symbol.for(GetSymbolKey("Icon.ExtraLarge"));
    export type ExtraLarge = typeof ExtraLarge;
}

export namespace Control
{
    export const Small: unique symbol = Symbol.for(GetSymbolKey("Control.Small"));
    export type Small = typeof Small;

    export const Medium: unique symbol = Symbol.for(GetSymbolKey("Control.Medium"));
    export type Medium = typeof Medium;

    export const Large: unique symbol = Symbol.for(GetSymbolKey("Control.Large"));
    export type Large = typeof Large;
}

export namespace TouchTarget
{
    export const Minimum: unique symbol = Symbol.for(GetSymbolKey("TouchTarget.Minimum"));
    export type Minimum = typeof Minimum;
}

export namespace Avatar
{
    export const Small: unique symbol = Symbol.for(GetSymbolKey("Avatar.Small"));
    export type Small = typeof Small;

    export const Medium: unique symbol = Symbol.for(GetSymbolKey("Avatar.Medium"));
    export type Medium = typeof Medium;

    export const Large: unique symbol = Symbol.for(GetSymbolKey("Avatar.Large"));
    export type Large = typeof Large;
}

export namespace PageIcon
{
    export const Small: unique symbol = Symbol.for(GetSymbolKey("PageIcon.Small"));
    export type Small = typeof Small;

    export const Medium: unique symbol = Symbol.for(GetSymbolKey("PageIcon.Medium"));
    export type Medium = typeof Medium;

    export const Large: unique symbol = Symbol.for(GetSymbolKey("PageIcon.Large"));
    export type Large = typeof Large;
}

export namespace Checkbox
{
    export const Default: unique symbol = Symbol.for(GetSymbolKey("Checkbox.Default"));
    export type Default = typeof Default;
}

export namespace ListRow
{
    export const MinimumHeight: unique symbol = Symbol.for(GetSymbolKey("ListRow.MinimumHeight"));
    export type MinimumHeight = typeof MinimumHeight;
}

export namespace Header
{
    export const Height: unique symbol = Symbol.for(GetSymbolKey("Header.Height"));
    export type Height = typeof Height;
}

export namespace BottomNavigation
{
    export const Height: unique symbol = Symbol.for(GetSymbolKey("BottomNavigation.Height"));
    export type Height = typeof Height;
}

export namespace SheetHandle
{
    export const Width: unique symbol = Symbol.for(GetSymbolKey("SheetHandle.Width"));
    export type Width = typeof Width;

    export const Height: unique symbol = Symbol.for(GetSymbolKey("SheetHandle.Height"));
    export type Height = typeof Height;
}

export type Size =
    | Icon.ExtraSmall
    | Icon.Small
    | Icon.Medium
    | Icon.Large
    | Icon.ExtraLarge
    | Control.Small
    | Control.Medium
    | Control.Large
    | TouchTarget.Minimum
    | Avatar.Small
    | Avatar.Medium
    | Avatar.Large
    | PageIcon.Small
    | PageIcon.Medium
    | PageIcon.Large
    | Checkbox.Default
    | ListRow.MinimumHeight
    | Header.Height
    | BottomNavigation.Height
    | SheetHandle.Width
    | SheetHandle.Height;
