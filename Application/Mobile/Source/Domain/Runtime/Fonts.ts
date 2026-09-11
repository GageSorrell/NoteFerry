/**
 * Custom font loading. iA Writer Mono is the app's monospace typeface --
 * loaded here under the exact family name `@noteferry/ui`'s `Text` resolves
 * `Family="Mono"` to (see `Text.tsx`'s `ResolveFontFamily`), so any text
 * rendered with that family picks it up once loading finishes, no matter
 * which screen mounted first. Today that's only the error-detail disclosure
 * in `SevereErrorScreen.tsx`, so a brief fallback-font flash while this
 * resolves is harmless and not worth gating the splash screen over.
 *
 * Font: iA Writer Mono S (Regular), from https://github.com/iaolo/iA-Fonts,
 * licensed under the SIL Open Font License 1.1 -- see
 * `Resource/Font/LICENSE.md`.
 *
 * @module noteferry/Domain/Runtime/Fonts
 *
 * @file      Fonts.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { useFonts } from "expo-font";

/**
 * The `fontFamily` value `@noteferry/ui` expects for `Family="Mono"` text.
 * Exported so `useAppFonts` and `Text.tsx` can't drift apart.
 *
 * @category Runtime
 * @since 1.0.0
 */
export const MonoFontFamily = "iA Writer Mono";

export/**
       * Loads the app's custom fonts. Call once from the root layout -- see
       * `_layout.tsx`. Returns `true` once loading finishes (successfully or
       * not); text requesting a custom family before then silently falls
       * back to the platform default until this flips and the mounted
       * `Text`s using it re-render.
       *
       * @category Runtime
       * @since 1.0.0
       */
const useAppFonts = (): boolean =>
{
    const [ FontsLoaded ] = useFonts({
        [ MonoFontFamily ]: require("../../../Resource/Font/iAWriterMonoS-Regular.ttf")
    });

    return FontsLoaded;
};
