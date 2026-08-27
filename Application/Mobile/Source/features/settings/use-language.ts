/**
 * The user's in-app language override — read from `LanguagePreference`'s
 * local storage (via `i18next`'s already-resolved active language) and
 * changed through `i18next.changeLanguage`, which `react-i18next`'s
 * `useTranslation` propagates to every mounted consumer, including
 * `App/_layout.tsx`'s `Stack.Screen` titles. Passing `null` clears the saved
 * override and falls back to the device's own locale on next launch.
 *
 * @module noteferry/features/settings/use-language
 *
 * @file      use-language.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Localization from "expo-localization";
import { ResolveSupportedLocale, WriteLanguageOverride } from "@/Domain/Localization";
import type { SupportedLocale } from "@/Domain/Localization";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** The active language, and a setter that persists the choice and applies it immediately. */
export interface UseLanguageResult
{
    readonly Current: SupportedLocale;
    readonly SetLanguage: (Locale: SupportedLocale | null) => Promise<void>;
}

/**
 * The active app language plus a setter for the user's in-app override.
 *
 * @category Settings
 * @since 1.0.0
 */
export const useLanguage = (): UseLanguageResult =>
{
    const { i18n } = useTranslation();

    const SetLanguage = useCallback(async (Locale: SupportedLocale | null): Promise<void> =>
    {
        await WriteLanguageOverride(Locale);

        /* `i18next.changeLanguage(undefined)` falls back to `fallbackLng`
         * ("en-US"), not the device's own locale — there's no `LanguageDetector`
         * plugin configured (device-locale resolution happens by hand in
         * `InitializeI18n`), so re-resolve it here too when clearing the
         * override, rather than only applying "system" on the next launch. */
        const NextLanguage = Locale
            ?? ResolveSupportedLocale(Localization.getLocales()[ 0 ]?.languageTag ?? "en-US");

        await i18n.changeLanguage(NextLanguage);
    }, [ i18n ]);

    return {
        Current: ResolveSupportedLocale(i18n.language),
        SetLanguage
    };
};
