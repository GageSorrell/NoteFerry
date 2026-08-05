/**
 * Shadow tokens.  RN shadow props (`shadowColor/Offset/Opacity/Radius` on
 * iOS, `elevation` on Android) only loosely approximate `@notion-kit/ui`'s
 * CSS `--shadow-notion` (an inset focus ring) and `--shadow-out-md` (a
 * layered card shadow) — see `ShadowValue.ts` for the concrete
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

const TypeId = "~notivex/ui/Token/Shadow" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export const FocusRing: unique symbol = Symbol.for(GetSymbolKey("FocusRing"));

export type FocusRing = typeof FocusRing;

export const Card: unique symbol = Symbol.for(GetSymbolKey("Card"));

export type Card = typeof Card;

export type Shadow =
    | FocusRing
    | Card;
