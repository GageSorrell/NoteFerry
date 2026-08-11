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
import type { ReadonlyRecord } from "effect/Record";

const TypeId = "~notivex/ui/Token/Size" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

/**
 * Size tokens for glyph and icon artwork.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace Icon
{
    export/**
           * The extra-small icon size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const ExtraSmall: unique symbol = Symbol.for(GetSymbolKey("Icon.ExtraSmall"));

    /** {@inheritDoc ExtraSmall} */
    export type ExtraSmall = typeof ExtraSmall;

    export/**
           * The small icon size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Small: unique symbol = Symbol.for(GetSymbolKey("Icon.Small"));

    /** {@inheritDoc Small} */
    export type Small = typeof Small;

    export/**
           * The medium icon size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Medium: unique symbol = Symbol.for(GetSymbolKey("Icon.Medium"));

    /** {@inheritDoc Medium} */
    export type Medium = typeof Medium;

    export/**
           * The large icon size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Large: unique symbol = Symbol.for(GetSymbolKey("Icon.Large"));

    /** {@inheritDoc Large} */
    export type Large = typeof Large;

    export/**
           * The extra-large icon size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const ExtraLarge: unique symbol = Symbol.for(GetSymbolKey("Icon.ExtraLarge"));

    /** {@inheritDoc ExtraLarge} */
    export type ExtraLarge = typeof ExtraLarge;
}

/**
 * Height tokens for interactive controls.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace Control
{
    export/**
           * The small control-height token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Small: unique symbol = Symbol.for(GetSymbolKey("Control.Small"));

    /** {@inheritDoc Small} */
    export type Small = typeof Small;

    export/**
           * The medium control-height token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Medium: unique symbol = Symbol.for(GetSymbolKey("Control.Medium"));

    /** {@inheritDoc Medium} */
    export type Medium = typeof Medium;

    export/**
           * The large control-height token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Large: unique symbol = Symbol.for(GetSymbolKey("Control.Large"));

    /** {@inheritDoc Large} */
    export type Large = typeof Large;
}

/**
 * Accessibility size tokens for interactive hit areas.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace TouchTarget
{
    export/**
           * The minimum accessible touch-target size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Minimum: unique symbol = Symbol.for(GetSymbolKey("TouchTarget.Minimum"));

    /** {@inheritDoc Minimum} */
    export type Minimum = typeof Minimum;
}

/**
 * Size tokens for user and workspace avatars.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace Avatar
{
    export/**
           * The small avatar size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Small: unique symbol = Symbol.for(GetSymbolKey("Avatar.Small"));

    /** {@inheritDoc Small} */
    export type Small = typeof Small;

    export/**
           * The medium avatar size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Medium: unique symbol = Symbol.for(GetSymbolKey("Avatar.Medium"));

    /** {@inheritDoc Medium} */
    export type Medium = typeof Medium;

    export/**
           * The large avatar size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Large: unique symbol = Symbol.for(GetSymbolKey("Avatar.Large"));

    /** {@inheritDoc Large} */
    export type Large = typeof Large;
}

/**
 * Size tokens for page icons.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace PageIcon
{
    export/**
           * The small page-icon size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Small: unique symbol = Symbol.for(GetSymbolKey("PageIcon.Small"));

    /** {@inheritDoc Small} */
    export type Small = typeof Small;

    export/**
           * The medium page-icon size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Medium: unique symbol = Symbol.for(GetSymbolKey("PageIcon.Medium"));

    /** {@inheritDoc Medium} */
    export type Medium = typeof Medium;

    export/**
           * The large page-icon size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Large: unique symbol = Symbol.for(GetSymbolKey("PageIcon.Large"));

    /** {@inheritDoc Large} */
    export type Large = typeof Large;
}

/**
 * Size tokens for checkbox controls.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace Checkbox
{
    export/**
           * The default checkbox size token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Default: unique symbol = Symbol.for(GetSymbolKey("Checkbox.Default"));

    /** {@inheritDoc Default} */
    export type Default = typeof Default;
}

/**
 * Size tokens for list rows.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace ListRow
{
    export/**
           * The minimum list-row height token.
           *
           * @category Token
           * @since 1.0.0
           */
    const MinimumHeight: unique symbol = Symbol.for(GetSymbolKey("ListRow.MinimumHeight"));

    /** {@inheritDoc MinimumHeight} */
    export type MinimumHeight = typeof MinimumHeight;
}

/**
 * Size tokens for screen headers.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace Header
{
    export/**
           * The standard header-height token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Height: unique symbol = Symbol.for(GetSymbolKey("Header.Height"));

    /** {@inheritDoc Height} */
    export type Height = typeof Height;
}

/**
 * Size tokens for bottom navigation.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace BottomNavigation
{
    export/**
           * The standard bottom-navigation height token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Height: unique symbol = Symbol.for(GetSymbolKey("BottomNavigation.Height"));

    /** {@inheritDoc Height} */
    export type Height = typeof Height;
}

/**
 * Size tokens for the draggable handle on a sheet.
 *
 * @category Token
 * @since 1.0.0
 */
export namespace SheetHandle
{
    export/**
           * The sheet-handle width token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Width: unique symbol = Symbol.for(GetSymbolKey("SheetHandle.Width"));

    /** {@inheritDoc Width} */
    export type Width = typeof Width;

    export/**
           * The sheet-handle height token.
           *
           * @category Token
           * @since 1.0.0
           */
    const Height: unique symbol = Symbol.for(GetSymbolKey("SheetHandle.Height"));

    /** {@inheritDoc Height} */
    export type Height = typeof Height;
}

/**
 * Any namespaced component-size token.
 *
 * @category Token
 * @since 1.0.0
 */
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

const Value: ReadonlyRecord<Size, number> = Object.freeze({
    [ Icon.ExtraSmall ]: 12,
    [ Icon.Small ]: 16,
    [ Icon.Medium ]: 20,
    [ Icon.Large ]: 24,
    [ Icon.ExtraLarge ]: 32,
    [ Control.Small ]: 32,
    [ Control.Medium ]: 40,
    [ Control.Large ]: 48,
    [ TouchTarget.Minimum ]: 44,
    [ Avatar.Small ]: 24,
    [ Avatar.Medium ]: 32,
    [ Avatar.Large ]: 48,
    [ PageIcon.Small ]: 20,
    [ PageIcon.Medium ]: 28,
    [ PageIcon.Large ]: 40,
    [ Checkbox.Default ]: 18,
    [ ListRow.MinimumHeight ]: 44,
    [ Header.Height ]: 56,
    [ BottomNavigation.Height ]: 56,
    [ SheetHandle.Width ]: 36,
    [ SheetHandle.Height ]: 5
} as const);

export/**
       * Resolves a `Size` token to its pixel value.
       *
       * @internal
       * @category Token
       * @since 1.0.0
       */
const Resolve = (Token: Size): number | undefined => Value[Token];
