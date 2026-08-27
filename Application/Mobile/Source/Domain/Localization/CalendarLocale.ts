/**
 * Bridges the active i18next language to `@noteferry/ui`'s `Calendar` locale
 * system (`RegisterCalendarLocale`). Deliberately kept out of `i18n.ts` —
 * `@noteferry/ui/Primitive`'s barrel pulls in every primitive (`Button`,
 * `BottomSheet`, Reanimated/Worklets among them), which is fine for the real
 * app but too heavy a dependency for `i18n.ts` to carry, since that module is
 * required directly by lightweight unit tests. Call `SyncCalendarLocales`
 * once from `App/_layout.tsx` (which already imports the full `@noteferry/ui`
 * barrel for `ThemeProvider`), after `InitializeI18n` resolves and again on
 * every `languageChanged` event.
 *
 * @module noteferry/Domain/Localization/CalendarLocale
 *
 * @file      CalendarLocale.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import i18next from "i18next";
import { RegisterCalendarLocale } from "@noteferry/ui/Primitive/Calendar";
import { ResolveCalendarLocaleNames } from "./DateFnsLocale";
import { SupportedLocales } from "./i18n";
import type { SupportedLocale } from "./i18n";

/**
 * Registers every supported locale's month/weekday names with `@noteferry/ui`'s
 * `Calendar` and makes the current i18next language the active one, then
 * keeps it in sync on every subsequent language change.
 *
 * @category Localization
 * @since 1.0.0
 */
export const SyncCalendarLocales = (): void =>
{
    for (const Locale of SupportedLocales)
    {
        RegisterCalendarLocale(Locale, ResolveCalendarLocaleNames(Locale));
    }

    RegisterCalendarLocale(i18next.language, ResolveCalendarLocaleNames(i18next.language as SupportedLocale));
    i18next.on("languageChanged", (NextLanguage: string) =>
    {
        RegisterCalendarLocale(NextLanguage, ResolveCalendarLocaleNames(NextLanguage as SupportedLocale));
    });
};
