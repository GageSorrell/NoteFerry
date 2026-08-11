/**
 * Tokens for the colors of Notion's palette.
 *
 * @module @notivex/ui/Token/Color
 *
 * @file      Color.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";
import type { ReadonlyRecord } from "effect/Record";

const TypeId = "~notivex/ui/Token/Color" as const;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export/**
       * The default neutral palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Default: unique symbol = Symbol.for(GetSymbolKey("Default"));

/** {@inheritDoc Default} */
export type Default = typeof Default;

export/**
       * The gray palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Gray: unique symbol = Symbol.for(GetSymbolKey("Gray"));

/** {@inheritDoc Gray} */
export type Gray = typeof Gray;

export/**
       * The brown palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Brown: unique symbol = Symbol.for(GetSymbolKey("Brown"));

/** {@inheritDoc Brown} */
export type Brown = typeof Brown;

export/**
       * The orange palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Orange: unique symbol = Symbol.for(GetSymbolKey("Orange"));

/** {@inheritDoc Orange} */
export type Orange = typeof Orange;

export/**
       * The yellow palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Yellow: unique symbol = Symbol.for(GetSymbolKey("Yellow"));

/** {@inheritDoc Yellow} */
export type Yellow = typeof Yellow;

export/**
       * The green palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Green: unique symbol = Symbol.for(GetSymbolKey("Green"));

/** {@inheritDoc Green} */
export type Green = typeof Green;

export/**
       * The blue palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Blue: unique symbol = Symbol.for(GetSymbolKey("Blue"));

/** {@inheritDoc Blue} */
export type Blue = typeof Blue;

export/**
       * The purple palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Purple: unique symbol = Symbol.for(GetSymbolKey("Purple"));

/** {@inheritDoc Purple} */
export type Purple = typeof Purple;

export/**
       * The pink palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Pink: unique symbol = Symbol.for(GetSymbolKey("Pink"));

/** {@inheritDoc Pink} */
export type Pink = typeof Pink;

export/**
       * The red palette color token.
       *
       * @category Token
       * @since 1.0.0
       */
const Red: unique symbol = Symbol.for(GetSymbolKey("Red"));

/** {@inheritDoc Red} */
export type Red = typeof Red;

/**
 * Any token in the theme-invariant Notion color palette.
 *
 * @category Token
 * @since 1.0.0
 */
export type Color =
    | Default
    | Gray
    | Brown
    | Orange
    | Yellow
    | Green
    | Blue
    | Purple
    | Pink
    | Red;

/* Preserve the public palette order above in the internal value record. */
/* eslint-disable sort-keys */
const Value: ReadonlyRecord<Color, string> = Object.freeze({
    [ Default ]: "#55534E",
    [ Gray ]: "#A6A299",
    [ Brown ]: "#9F6B53",
    [ Orange ]: "#D9730D",
    [ Yellow ]: "#CB912F",
    [ Green ]: "#448361",
    [ Blue ]: "#337EA9",
    [ Purple ]: "#9065B0",
    [ Pink ]: "#C14C8A",
    [ Red ]: "#D44C47"
} as const);
/* eslint-enable sort-keys */

export/**
       * Resolves a `Color` token to its theme-invariant color string.
       *
       * @internal
       * @category Token
       * @since 1.0.0
       */
const Resolve = (Token: Color): string | undefined => Value[Token];
