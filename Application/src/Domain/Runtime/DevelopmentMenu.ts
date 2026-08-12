/**
 * Development-client menu extensions. This module is registered by the root
 * layout only in development builds.
 *
 * @module notivex/Domain/Runtime/DevelopmentMenu
 *
 * @file      DevelopmentMenu.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ClearPersistedState } from "./PersistedState";
import { DevSettings } from "react-native";
import type { Href } from "expo-router";
import { registerDevMenuItems } from "expo-dev-client";
import { router } from "expo-router";

/** Clears persisted state and reloads so in-memory auth/context state is reset. */
async function ClearAndReload(): Promise<void>
{
    try
    {
        await ClearPersistedState();
    }
    catch (Error)
    {
        /* eslint-disable-next-line no-console */
        console.error("Failed to clear all persisted app state", Error);
    }
    finally
    {
        DevSettings.reload("Cleared persisted app state");
    }
}

export/**
       * Adds Notivex-specific actions to Expo's development-client menu.
       *
       * @category Development
       * @since 1.0.0
       */
const RegisterDevelopmentMenu = async (): Promise<void> =>
{
    if (!__DEV__)
    {
        return;
    }

    await registerDevMenuItems([
        {
            callback: () => router.navigate("/onboarding-scenarios" as Href),
            name: "Onboarding scenarios",
            shouldCollapse: true
        },
        {
            callback: ClearAndReload,
            name: "Clear persisted state",
            shouldCollapse: true
        }
    ]);
};
