/**
 * A tripwire against `t()` typos and missing-namespace registration: renders
 * a couple of real translated strings from the `settings` namespace, once
 * per supported locale, through the actual `Domain/Localization` resources
 * and `react-i18next`.
 *
 * This deliberately doesn't render a full screen component (e.g.
 * `general-settings.tsx`) — that screen's tree pulls in `@gorhom/bottom-sheet`,
 * `react-native-reanimated` gesture-driven sorting, and several
 * network-backed hooks (`useSettings`, `useSubscription`, `useConnections`),
 * none of which are about localization. Exercising the real translation
 * pipeline end to end, the way this test does, is what actually catches a
 * broken key or an unregistered namespace; mocking the rest of that tree
 * just to satisfy a render call would add a lot of fragile setup for no
 * additional localization coverage.
 *
 * @file      translation-smoke.test.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { I18nextProvider, useTranslation } from "react-i18next";
import { InitializeI18n, SupportedLocale, SupportedLocales } from "./i18n";
import { beforeAll, describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import i18next from "i18next";

jest.mock("expo-localization", () => ({
    getLocales: () => [ { languageTag: "en-US" } ]
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    removeItem: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    setItem: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
}));

/** Renders two representative `settings` namespace strings for the active i18next language. */
const TranslationProbe = (): React.JSX.Element =>
{
    const { t } = useTranslation("settings");

    return (
        <>
            <Text>{ t("titles.general") }</Text>
            <Text>{ t("general.proGate.title") }</Text>
        </>
    );
};

describe("translated screens render real, non-empty copy", () =>
{
    beforeAll(async () =>
    {
        await InitializeI18n();
    });

    it.each(SupportedLocales)("renders the settings namespace in %s", async (Locale: SupportedLocale) =>
    {
        await i18next.changeLanguage(Locale);

        const { getByText } = await render(
            <I18nextProvider i18n={ i18next }>
                <TranslationProbe />
            </I18nextProvider>
        );

        const GeneralTitle = i18next.t("titles.general", { ns: "settings" });
        const ProGateTitle = i18next.t("general.proGate.title", { ns: "settings" });

        expect(getByText(GeneralTitle)).toBeTruthy();
        expect(getByText(ProGateTitle)).toBeTruthy();

        /* A raw i18next key falling through untranslated looks like
         * "titles.general" or "general.proGate.title" — guard against that
         * silent failure mode explicitly, not just against an empty string. */
        expect(GeneralTitle).not.toBe("titles.general");
        expect(ProGateTitle).not.toBe("general.proGate.title");
    });
});
