/**
 * Branded types and utilities for using assets, such as images.
 *
 * @module noteferry/Domain/Utility/Asset
 *
 * @file      Asset.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Brand from "effect/Brand";

/** {@inheritDoc ImageAsset:var} */
export type ImageAsset = Brand.Branded<string, "ImageAsset">;

export/**
       * A branded path to an image file.
       *
       * @category Utility
       * @since 1.0.0
       */
const ImageAsset = Brand.nominal<ImageAsset>();
