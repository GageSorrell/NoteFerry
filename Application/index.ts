/**
 * Custom Metro entrypoint for `notivex`.
 *
 * `effect` touches the Web Crypto API and `TextDecoder` at module-evaluation
 * time (see `effect/Random` and `effect/Encoding` in the `effect` v4 beta
 * source), and Hermes provides neither out of the box. Both polyfills have
 * to run before anything else in the bundle gets a chance to import
 * `effect` transitively — which is why this file replaces
 * `expo-router/entry` as `main` and imports the polyfills first, only
 * side-effect importing the real Expo Router entrypoint afterward.
 *
 * @module notivex
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable sort-imports */

import "@bacons/text-decoder/install";
import { polyfillWebCrypto } from "expo-standard-web-crypto";

polyfillWebCrypto();

/* Defers to Expo Router's default entrypoint to actually render the app. */
import "expo-router/entry";
