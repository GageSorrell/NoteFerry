/**
 * @module @noteferry/ui/Utility/SvgDataUri
 * @internal
 *
 * @file      SvgDataUri.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export/**
       * Encodes raw SVG XML markup as a percent-encoded `data:image/svg+xml,...`
       * URI, suitable for RN core's `Image` component — used by every
       * `.windows.tsx` file that renders vector content through RNW's native
       * SVG support instead of `react-native-svg` (see `Icon.windows.tsx`'s
       * header comment for why). Percent-encoding rather than base64 avoids
       * needing a `btoa`/`Buffer` polyfill in the Hermes runtime.
       *
       * @category Utility
       * @since 1.0.0
       */
const EncodeSvgDataUri = (Markup: string): string => `data:image/svg+xml,${ encodeURIComponent(Markup) }`;
