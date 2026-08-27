/**
 * @file      i18n.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { InitializeI18n, SupportedLocale, SupportedLocales } from "./i18n";
import { beforeAll, describe, expect, it } from "@jest/globals";
import i18next from "i18next";

jest.mock("expo-localization", () => ({
    getLocales: () => [ { languageTag: "en-US" } ]
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    removeItem: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    setItem: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
}));

const Namespaces = [
    "common",
    "settings",
    "onboarding",
    "subscription",
    "pageCreation",
    "feedback",
    "component",
    "errors",
    "home"
] as const;

describe("InitializeI18n", () =>
{
    beforeAll(async () =>
    {
        await InitializeI18n();
    });

    it("resolves without throwing and defaults to en-US when there is no override", () =>
    {
        expect(i18next.language).toBe("en-US");
    });

    it.each(SupportedLocales)("loads every namespace for %s", (Locale: SupportedLocale) =>
    {
        for (const Namespace of Namespaces)
        {
            expect(i18next.hasResourceBundle(Locale, Namespace)).toBe(true);
        }
    });

    it("has Intl.PluralRules available (Hermes should provide this — no polyfill expected)", () =>
    {
        expect(typeof Intl.PluralRules).toBe("function");
    });
});
