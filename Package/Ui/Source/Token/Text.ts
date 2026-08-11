/**
 * Namespaced semantic and common text styles.
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

export/**
       * The token for bold text.
       *
       * @category Token
       * @since 1.0.0
       */
const Bold: unique symbol = Symbol.for(GetSymbolKey("Bold"));

/** {@inheritDoc Bold} */
export type Bold = typeof Bold;

export/**
       * The token for italic text.
       *
       * @category Token
       * @since 1.0.0
       */
const Italic: unique symbol = Symbol.for(GetSymbolKey("Italic"));

/** {@inheritDoc Italic} */
export type Italic = typeof Italic;

export/**
       * The token for text with a line through it.
       *
       * @category Token
       * @since 1.0.0
       */
const Strikethrough: unique symbol = Symbol.for(GetSymbolKey("Strikethrough"));

/** {@inheritDoc Strikethrough} */
export type Strikethrough = typeof Strikethrough;

export/**
       * The token for underlined text.
       *
       * @category Token
       * @since 1.0.0
       */
const Underline: unique symbol = Symbol.for(GetSymbolKey("Underline"));

/** {@inheritDoc Underline} */
export type Underline = typeof Underline;

export/**
       * The token for inline code text.
       *
       * @category Token
       * @since 1.0.0
       */
const Code: unique symbol = Symbol.for(GetSymbolKey("Code"));

/** {@inheritDoc Code} */
export type Code = typeof Code;

/**
 * Any inline text-formatting token.
 *
 * @category Token
 * @since 1.0.0
 */
export type TextStyle =
    | Bold
    | Italic
    | Underline
    | Strikethrough
    | Code;
