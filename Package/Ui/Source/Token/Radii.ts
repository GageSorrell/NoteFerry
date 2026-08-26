/**
 * Corner-radius tokens, reconciled from `@notion-kit/ui`'s `--radius` scale
 * (`--radius: 0.5rem` with `sm/md/lg/xl` derived at ±4px steps).
 *
 * @module @noteferry/ui/Token/Radii
 *
 * @file      Radii.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";
import type { ReadonlyRecord } from "effect/Record";

const TypeId = "~noteferry/ui/Token/Radii" as const;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export/**
       * The token for square corners with no radius.
       *
       * @category Token
       * @since 1.0.0
       */
const None: unique symbol = Symbol.for(GetSymbolKey("None"));

/** {@inheritDoc None} */
export type None = typeof None;

export/**
       * The token for a small corner radius.
       *
       * @category Token
       * @since 1.0.0
       */
const Small: unique symbol = Symbol.for(GetSymbolKey("Small"));

/** {@inheritDoc Small} */
export type Small = typeof Small;

export/**
       * The token for a medium corner radius.
       *
       * @category Token
       * @since 1.0.0
       */
const Medium: unique symbol = Symbol.for(GetSymbolKey("Medium"));

/** {@inheritDoc Medium} */
export type Medium = typeof Medium;

export/**
       * The token for a large corner radius.
       *
       * @category Token
       * @since 1.0.0
       */
const Large: unique symbol = Symbol.for(GetSymbolKey("Large"));

/** {@inheritDoc Large} */
export type Large = typeof Large;

export/**
       * The token for an extra-large corner radius.
       *
       * @category Token
       * @since 1.0.0
       */
const ExtraLarge: unique symbol = Symbol.for(GetSymbolKey("ExtraLarge"));

/** {@inheritDoc ExtraLarge} */
export type ExtraLarge = typeof ExtraLarge;

export/**
       * The token for a fully rounded or pill-shaped corner radius.
       *
       * @category Token
       * @since 1.0.0
       */
const Full: unique symbol = Symbol.for(GetSymbolKey("Full"));

/** {@inheritDoc Full} */
export type Full = typeof Full;

/**
 * Any corner-radius token.
 *
 * @category Token
 * @since 1.0.0
 */
export type Radii =
    | None
    | Small
    | Medium
    | Large
    | ExtraLarge
    | Full;

/* Preserve the public radius-scale order above in the internal value record. */
/* eslint-disable sort-keys */
const Value: ReadonlyRecord<Radii, number> = Object.freeze({
    [ None ]: 0,
    [ Small ]: 4,
    [ Medium ]: 8,
    [ Large ]: 10,
    [ ExtraLarge ]: 12,
    [ Full ]: 9999
} as const);
/* eslint-enable sort-keys */

export/**
       * Resolves a `Radii` token to its pixel value.
       *
       * @internal
       * @category Token
       * @since 1.0.0
       */
const Resolve = (Token: Radii): number | undefined => Value[Token];
