/**
 *
 *
 * @module @notivex/ui/Token/Text
 *
 * @file      Text.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";

const TypeId = "~notivex/ui/Token/Text" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export const Bold: unique symbol = Symbol.for(GetSymbolKey("Bold"));

export type Bold = typeof Bold;

export const Italic: unique symbol = Symbol.for(GetSymbolKey("Italic"));

export type Italic = typeof Italic;

export const Strikethrough: unique symbol = Symbol.for(GetSymbolKey("Strikethrough"));

export type Strikethrough = typeof Strikethrough;

export const Underline: unique symbol = Symbol.for(GetSymbolKey("Underline"));

export type Underline = typeof Underline;

export const Code: unique symbol = Symbol.for(GetSymbolKey("Code"));

export type Code = typeof Code;

export type TextStyle =
    | Bold
    | Italic
    | Underline
    | Strikethrough
    | Code;
