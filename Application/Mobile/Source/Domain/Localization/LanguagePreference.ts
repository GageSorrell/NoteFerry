/**
 * The user's in-app language override, if they've set one. Stored locally
 * (not in the server-side profile settings from `Package/Domain/Source/Settings.ts`)
 * because it has to resolve before a session exists — on the sign-in,
 * sign-in-modal, and onboarding screens.
 *
 * @module noteferry/Domain/Localization/LanguagePreference
 *
 * @file      LanguagePreference.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedLocale } from "./i18n";

const StorageKey = "noteferry:language-override";

/**
 * The user's saved language override, or `null` if they've never set one
 * (in which case the device's own locale is used instead).
 *
 * @category Localization
 * @since 1.0.0
 */
export const ReadLanguageOverride = async (): Promise<SupportedLocale | null> =>
    (await AsyncStorage.getItem(StorageKey)) as SupportedLocale | null;

/**
 * Saves the user's chosen language override, or clears it (`null`) to fall
 * back to the device's own locale again.
 *
 * @category Localization
 * @since 1.0.0
 */
export const WriteLanguageOverride = async (Locale: SupportedLocale | null): Promise<void> =>
{
    if (Locale === null)
    {
        await AsyncStorage.removeItem(StorageKey);
        return;
    }

    await AsyncStorage.setItem(StorageKey, Locale);
};
