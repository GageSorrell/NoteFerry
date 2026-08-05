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

const TypeId = "~notivex/ui/Token/Color" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export const Default: unique symbol = Symbol.for(GetSymbolKey("Default"));

export type Default = typeof Default;

export const Gray: unique symbol = Symbol.for(GetSymbolKey("Gray"));

export type Gray = typeof Gray;

export const Brown: unique symbol = Symbol.for(GetSymbolKey("Brown"));

export type Brown = typeof Brown;

export const Orange: unique symbol = Symbol.for(GetSymbolKey("Orange"));

export type Orange = typeof Orange;

export const Yellow: unique symbol = Symbol.for(GetSymbolKey("Yellow"));

export type Yellow = typeof Yellow;

export const Green: unique symbol = Symbol.for(GetSymbolKey("Green"));

export type Green = typeof Green;

export const Blue: unique symbol = Symbol.for(GetSymbolKey("Blue"));

export type Blue = typeof Blue;

export const Purple: unique symbol = Symbol.for(GetSymbolKey("Purple"));

export type Purple = typeof Purple;

export const Pink: unique symbol = Symbol.for(GetSymbolKey("Pink"));

export type Pink = typeof Pink;

export const Red: unique symbol = Symbol.for(GetSymbolKey("Red"));

export type Red = typeof Red;

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
