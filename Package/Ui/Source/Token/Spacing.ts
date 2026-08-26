/**
 * Tokens for a quantity of empty space, not how large something is (see
 * `Token/Size` for that).  A flat numeric scale plus semantic aliases for
 * the handful of spacing decisions that recur across the whole library.
 *
 * @module @noteferry/ui/Token/Spacing
 *
 * @file      Spacing.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";
import type { ReadonlyRecord } from "effect/Record";

const TypeId = "~noteferry/ui/Token/Spacing" as const;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export/**
       * The zero-spacing token.
       *
       * @category Token
       * @since 1.0.0
       */
const None: unique symbol = Symbol.for(GetSymbolKey("None"));

/** {@inheritDoc None} */
export type None = typeof None;

export/**
       * The extra-small spacing-scale token.
       *
       * @category Token
       * @since 1.0.0
       */
const Xs: unique symbol = Symbol.for(GetSymbolKey("Xs"));

/** {@inheritDoc Xs} */
export type Xs = typeof Xs;

export/**
       * The small spacing-scale token.
       *
       * @category Token
       * @since 1.0.0
       */
const S: unique symbol = Symbol.for(GetSymbolKey("S"));

/** {@inheritDoc S} */
export type S = typeof S;

export/**
       * The medium spacing-scale token.
       *
       * @category Token
       * @since 1.0.0
       */
const M: unique symbol = Symbol.for(GetSymbolKey("M"));

/** {@inheritDoc M} */
export type M = typeof M;

export/**
       * The large spacing-scale token.
       *
       * @category Token
       * @since 1.0.0
       */
const L: unique symbol = Symbol.for(GetSymbolKey("L"));

/** {@inheritDoc L} */
export type L = typeof L;

export/**
       * The extra-large spacing-scale token.
       *
       * @category Token
       * @since 1.0.0
       */
const Xl: unique symbol = Symbol.for(GetSymbolKey("Xl"));

/** {@inheritDoc Xl} */
export type Xl = typeof Xl;

export/**
       * The double-extra-large spacing-scale token.
       *
       * @category Token
       * @since 1.0.0
       */
const Xxl: unique symbol = Symbol.for(GetSymbolKey("Xxl"));

/** {@inheritDoc Xxl} */
export type Xxl = typeof Xxl;

export/**
       * The horizontal inset token for screen content.
       *
       * @category Token
       * @since 1.0.0
       */
const ScreenHorizontal: unique symbol = Symbol.for(GetSymbolKey("ScreenHorizontal"));

/** {@inheritDoc ScreenHorizontal} */
export type ScreenHorizontal = typeof ScreenHorizontal;

export/**
       * The vertical inset token for screen content.
       *
       * @category Token
       * @since 1.0.0
       */
const ScreenVertical: unique symbol = Symbol.for(GetSymbolKey("ScreenVertical"));

/** {@inheritDoc ScreenVertical} */
export type ScreenVertical = typeof ScreenVertical;

export/**
       * The gap token between major content sections.
       *
       * @category Token
       * @since 1.0.0
       */
const SectionGap: unique symbol = Symbol.for(GetSymbolKey("SectionGap"));

/** {@inheritDoc SectionGap} */
export type SectionGap = typeof SectionGap;

export/**
       * The gap token between related content groups.
       *
       * @category Token
       * @since 1.0.0
       */
const GroupGap: unique symbol = Symbol.for(GetSymbolKey("GroupGap"));

/** {@inheritDoc GroupGap} */
export type GroupGap = typeof GroupGap;

export/**
       * The horizontal inset token for list and menu rows.
       *
       * @category Token
       * @since 1.0.0
       */
const RowHorizontal: unique symbol = Symbol.for(GetSymbolKey("RowHorizontal"));

/** {@inheritDoc RowHorizontal} */
export type RowHorizontal = typeof RowHorizontal;

export/**
       * The vertical inset token for list and menu rows.
       *
       * @category Token
       * @since 1.0.0
       */
const RowVertical: unique symbol = Symbol.for(GetSymbolKey("RowVertical"));

/** {@inheritDoc RowVertical} */
export type RowVertical = typeof RowVertical;

export/**
       * The gap token between controls in a group.
       *
       * @category Token
       * @since 1.0.0
       */
const ControlGap: unique symbol = Symbol.for(GetSymbolKey("ControlGap"));

/** {@inheritDoc ControlGap} */
export type ControlGap = typeof ControlGap;

export/**
       * The gap token between an icon and adjacent text.
       *
       * @category Token
       * @since 1.0.0
       */
const IconTextGap: unique symbol = Symbol.for(GetSymbolKey("IconTextGap"));

/** {@inheritDoc IconTextGap} */
export type IconTextGap = typeof IconTextGap;

export/**
       * The gap token between inline elements.
       *
       * @category Token
       * @since 1.0.0
       */
const InlineGap: unique symbol = Symbol.for(GetSymbolKey("InlineGap"));

/** {@inheritDoc InlineGap} */
export type InlineGap = typeof InlineGap;

export/**
       * The horizontal inset token for sheet content.
       *
       * @category Token
       * @since 1.0.0
       */
const SheetHorizontal: unique symbol = Symbol.for(GetSymbolKey("SheetHorizontal"));

/** {@inheritDoc SheetHorizontal} */
export type SheetHorizontal = typeof SheetHorizontal;

export/**
       * The vertical inset token for sheet content.
       *
       * @category Token
       * @since 1.0.0
       */
const SheetVertical: unique symbol = Symbol.for(GetSymbolKey("SheetVertical"));

/** {@inheritDoc SheetVertical} */
export type SheetVertical = typeof SheetVertical;

/**
 * Any spacing-scale or semantic-spacing token.
 *
 * @category Token
 * @since 1.0.0
 */
export type Spacing =
    | None
    | Xs
    | S
    | M
    | L
    | Xl
    | Xxl
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

const Scale =
    Object.freeze({
        DoubleExtraLarge: 32,
        ExtraLarge: 24,
        ExtraSmall: 4,
        Large: 16,
        Medium: 12,
        None: 0,
        Small: 8
    } as const);

/* Preserve scale order followed by semantic aliases. */
/* eslint-disable sort-keys */
const Value: ReadonlyRecord<Spacing, number> = Object.freeze({
    [ None ]: Scale.None,
    [ Xs ]: Scale.ExtraSmall,
    [ S ]: Scale.Small,
    [ M ]: Scale.Medium,
    [ L ]: Scale.Large,
    [ Xl ]: Scale.ExtraLarge,
    [ Xxl ]: Scale.DoubleExtraLarge,
    [ ScreenHorizontal ]: Scale.Medium,
    [ ScreenVertical ]: Scale.Medium,
    [ SectionGap ]: Scale.ExtraLarge,
    [ GroupGap ]: Scale.Large,
    [ RowHorizontal ]: Scale.Medium,
    [ RowVertical ]: Scale.Small,
    [ ControlGap ]: Scale.Small,
    [ IconTextGap ]: Scale.ExtraSmall,
    [ InlineGap ]: Scale.ExtraSmall,
    [ SheetHorizontal ]: Scale.Medium,
    [ SheetVertical ]: Scale.Medium
} as const);
/* eslint-enable sort-keys */

export/**
       * Resolves a `Spacing` token to its pixel value.
       *
       * @internal
       * @category Token
       * @since 1.0.0
       */
const Resolve = (Token: Spacing): number | undefined => Value[Token];
