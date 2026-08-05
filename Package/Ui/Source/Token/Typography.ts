/**
 * Typography tokens, ported from `@notion-kit/ui`'s `primitives/variants.ts`
 * `typography` cva (`h1, h2, h3, body, label, desc`).
 *
 * @module @notivex/ui/Token/Typography
 *
 * @file      Typography.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";

const TypeId = "~notivex/ui/Token/Typography" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export const Heading1: unique symbol = Symbol.for(GetSymbolKey("Heading1"));

export type Heading1 = typeof Heading1;

export const Heading2: unique symbol = Symbol.for(GetSymbolKey("Heading2"));

export type Heading2 = typeof Heading2;

export const Heading3: unique symbol = Symbol.for(GetSymbolKey("Heading3"));

export type Heading3 = typeof Heading3;

export const Body: unique symbol = Symbol.for(GetSymbolKey("Body"));

export type Body = typeof Body;

export const Label: unique symbol = Symbol.for(GetSymbolKey("Label"));

export type Label = typeof Label;

export const Description: unique symbol = Symbol.for(GetSymbolKey("Description"));

export type Description = typeof Description;

export type Typography =
    | Heading1
    | Heading2
    | Heading3
    | Body
    | Label
    | Description;
