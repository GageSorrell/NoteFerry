/**
 * Shadow tokens.  RN shadow props (`shadowColor/Offset/Opacity/Radius` on
 * iOS, `elevation` on Android) only loosely approximate `@notion-kit/ui`'s
 * CSS `--shadow-notion` (an inset focus ring) and `--shadow-out-md` (a
 * layered card shadow) — see the value table below for the concrete
 * approximation. Lower priority than the other tokens; extend as real
 * consumers need finer fidelity.
 *
 * @module @notivex/ui/Token/Shadow
 *
 * @file      Shadow.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";
import type { ReadonlyRecord } from "effect/Record";

const TypeId = "~notivex/ui/Token/Shadow" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export/**
       * The token for the focused-control ring treatment.
       *
       * @category Token
       * @since 1.0.0
       */
const FocusRing: unique symbol = Symbol.for(GetSymbolKey("FocusRing"));

/** {@inheritDoc FocusRing} */
export type FocusRing = typeof FocusRing;

export/**
       * The token for an elevated card shadow.
       *
       * @category Token
       * @since 1.0.0
       */
const Card: unique symbol = Symbol.for(GetSymbolKey("Card"));

/** {@inheritDoc Card} */
export type Card = typeof Card;

/**
 * Any React Native shadow-style token.
 *
 * @category Token
 * @since 1.0.0
 */
export type Shadow =
    | FocusRing
    | Card;

/**
 * The style values applied to items that have a shadow.
 *
 * @category Token
 * @since 1.0.0
 */
export interface ShadowValue
{
    /**
     * The optional border width used to approximate an inset ring.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly BorderWidth?: number;

    /**
     * The optional border color used to approximate an inset ring.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly BorderColor?: string;

    /**
     * The shadow color.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly ShadowColor?: string;

    /**
     * The horizontal and vertical shadow offset.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly ShadowOffset?:
    {
        /**
         * The vertical shadow offset.
         *
         * @category Token
         * @since 1.0.0
         */
        readonly Height: number;

        /**
         * The horizontal shadow offset.
         *
         * @category Token
         * @since 1.0.0
         */
        readonly Width: number;
    };

    /**
     * The shadow opacity from zero to one.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly ShadowOpacity?: number;

    /**
     * The shadow blur radius.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly ShadowRadius?: number;

    /**
     * The Android elevation approximation.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly Elevation?: number;
}

/* Preserve the public shadow-token order above in the internal value record. */
/* eslint-disable sort-keys */
const Value: ReadonlyRecord<Shadow, ShadowValue> = Object.freeze({
    [ FocusRing ]:
    {
        BorderColor: "rgba(35, 131, 226, 0.35)",
        BorderWidth: 2
    },
    [ Card ]:
    {
        Elevation: 5,
        ShadowColor: "#333333",
        ShadowOffset:
        {
            Height: 8,
            Width: 0
        },
        ShadowOpacity: 0.07,
        ShadowRadius: 8
    }
} as const);
/* eslint-enable sort-keys */

export/**
       * Resolve a `Shadow` token to its corresponding styles.
       *
       * @internal
       * @category Token
       * @since 1.0.0
       */
const Resolve = (Token: Shadow): ShadowValue | undefined => Value[Token];
