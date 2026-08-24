/**
 * Resolves whether `@notivex/ui`'s `ThemeProvider` should render in high
 * contrast, from the app's `Contrast` setting: `"Standard"`/`"High"` pin the
 * result; the default `"System"` instead follows the OS's own
 * increase-contrast accessibility setting — Android's "High contrast text"
 * (`AccessibilityInfo.isHighTextContrastEnabled`) or iOS's "Increase
 * Contrast" (`AccessibilityInfo.isDarkerSystemColorsEnabled`) — read live and
 * kept in sync via `AccessibilityInfo`'s change events.
 *
 * @module notivex/features/settings/use-high-contrast
 *
 * @file      use-high-contrast.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AccessibilityInfo, Platform } from "react-native";
import { useEffect, useState } from "react";
import { useSettings } from "@/features/settings/use-settings";

/** Queries the OS's own increase-contrast accessibility setting, if this platform has one. */
const QuerySystemHighContrast = async (): Promise<boolean> =>
{
    if (Platform.OS === "android")
    {
        return AccessibilityInfo.isHighTextContrastEnabled();
    }

    if (Platform.OS === "ios")
    {
        return AccessibilityInfo.isDarkerSystemColorsEnabled();
    }

    return false;
};

/**
 * Live system "increase contrast" state, refreshed on mount and whenever the
 * OS reports the setting changed. Neither the query nor the change event
 * exists outside Android/iOS, so other platforms just stay `false`.
 */
const useSystemHighContrast = (): boolean =>
{
    const [ SystemHighContrast, SetSystemHighContrast ] = useState(false);

    useEffect(() =>
    {
        let Cancelled = false;

        void QuerySystemHighContrast().then((Enabled: boolean) =>
        {
            if (!Cancelled)
            {
                SetSystemHighContrast(Enabled);
            }
        });

        if (Platform.OS !== "android" && Platform.OS !== "ios")
        {
            return () =>
            {
                Cancelled = true;
            };
        }

        const Subscription = AccessibilityInfo.addEventListener(
            Platform.OS === "android" ? "highTextContrastChanged" : "darkerSystemColorsChanged",
            SetSystemHighContrast
        );

        return () =>
        {
            Cancelled = true;
            Subscription.remove();
        };
    }, [ ]);

    return SystemHighContrast;
};

/**
 * Resolves the boolean `@notivex/ui`'s `ThemeProvider` expects for its
 * `HighContrast` prop, from the user's `Contrast` app setting — falling back
 * to the OS's own increase-contrast setting while `Contrast` is `"System"`.
 *
 * @category Settings
 * @since 1.0.0
 */
export const useHighContrast = (): boolean =>
{
    const { Settings: AppSettings } = useSettings();
    const SystemHighContrast = useSystemHighContrast();

    if (AppSettings.Contrast === "Standard")
    {
        return false;
    }

    if (AppSettings.Contrast === "High")
    {
        return true;
    }

    return SystemHighContrast;
};
