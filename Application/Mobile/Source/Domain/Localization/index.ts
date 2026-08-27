/**
 * @module noteferry/Domain/Localization
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export * as Brand from "./Brand";
export { InitializeI18n, ResolveSupportedLocale, SupportedLocales } from "./i18n";
export type { SupportedLocale } from "./i18n";
export { ReadLanguageOverride, WriteLanguageOverride } from "./LanguagePreference";
export { ResolveCalendarLocaleNames, ResolveDateFnsLocale } from "./DateFnsLocale";
export { SyncCalendarLocales } from "./CalendarLocale";
