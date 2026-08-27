/**
 * i18next setup: the five locales NoteFerry ships translations for, the
 * device-locale → supported-locale mapping used on first launch, and
 * `InitializeI18n`, which loads the bundled translation JSON and applies any
 * saved language override before the app renders anything.
 *
 * @module noteferry/Domain/Localization/i18n
 *
 * @file      i18n.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Localization from "expo-localization";
import De from "./Resources/de";
import EnUS from "./Resources/en-US";
import Es419 from "./Resources/es-419";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import Ja from "./Resources/ja";
import Ko from "./Resources/ko";
import { ReadLanguageOverride } from "./LanguagePreference";

/**
 * Every locale NoteFerry ships translations for. `en-US` is the source
 * language; the rest are translated from it.
 *
 * @category Localization
 * @since 1.0.0
 */
export const SupportedLocales = [ "en-US", "es-419", "ko", "ja", "de" ] as const;

/** {@inheritDoc SupportedLocales} */
export type SupportedLocale = (typeof SupportedLocales)[ number ];

/**
 * Maps a BCP-47 device/locale tag to the closest {@link SupportedLocale}.
 * Spanish folds to the neutral Latin American variant regardless of region;
 * German folds to the single `de` bundle regardless of country (Austria,
 * Switzerland, etc.); anything unrecognized falls back to `en-US`.
 *
 * @category Localization
 * @since 1.0.0
 */
export const ResolveSupportedLocale = (Tag: string): SupportedLocale =>
{
    const Lower = Tag.toLowerCase();

    if (Lower.startsWith("es")) return "es-419";
    if (Lower.startsWith("ko")) return "ko";
    if (Lower.startsWith("ja")) return "ja";
    if (Lower.startsWith("de")) return "de";

    return "en-US";
};

/**
 * Initializes i18next with all five bundled translation sets, resolving the
 * active language from a saved user override if one exists, otherwise from
 * the device's own locale. Must resolve before the app renders — see the
 * splash-screen gate in `App/_layout.tsx`.
 *
 * @category Localization
 * @since 1.0.0
 */
export const InitializeI18n = async (): Promise<void> =>
{
    const Override = await ReadLanguageOverride();
    const DeviceTag = Localization.getLocales()[ 0 ]?.languageTag ?? "en-US";
    const DeviceLocale = ResolveSupportedLocale(DeviceTag);

    await i18next.use(initReactI18next).init({
        compatibilityJSON: "v4",
        defaultNS: "common",
        fallbackLng: "en-US",
        interpolation: { escapeValue: false },
        lng: Override ?? DeviceLocale,
        ns: [
            "common",
            "settings",
            "onboarding",
            "subscription",
            "pageCreation",
            "feedback",
            "component",
            "errors",
            "home"
        ],
        resources: {
            de: De,
            "en-US": EnUS,
            "es-419": Es419,
            ja: Ja,
            ko: Ko
        },
        returnNull: false
    });
};
