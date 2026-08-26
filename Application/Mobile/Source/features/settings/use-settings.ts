/**
 * Hook backing the settings screen and anywhere else app-wide settings are
 * read (home-screen ordering, quick actions, launch behavior). Thin wrapper
 * over the typed API client, mirroring `use-destinations.ts`.
 *
 * @module noteferry/features/settings/use-settings
 *
 * @file      use-settings.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { GetProfile, NoSessionError, UpdateProfileSettings } from "@/Domain/Runtime/NoteFerryApi";
import { useCallback, useEffect, useState } from "react";

/** The state returned by {@link useSettings}. */
export interface UseSettings
{
    readonly IsLoading: boolean;
    readonly Refetch: () => Promise<void>;
    readonly Settings: Domain.Settings.ResolvedAppSettings;
    readonly Update: (Patch: Domain.Settings.AppSettings) => Promise<void>;
}

export/**
       * Loads the current user's app-wide settings (resolved to concrete values via
       * `Domain.Settings.WithDefaults`) and exposes a merging update, refetching
       * afterward.
       *
       * @category Settings
       * @since 1.0.0
       */
const useSettings = (): UseSettings =>
{
    const [ Settings, SetSettings ] =
        useState<Domain.Settings.ResolvedAppSettings>(Domain.Settings.DefaultAppSettings);

    const [ IsLoading, SetIsLoading ] = useState(true);

    const Refetch = useCallback(async () =>
    {
        SetIsLoading(true);

        try
        {
            const Profile = await GetProfile();

            SetSettings(Domain.Settings.WithDefaults(Profile.Settings));
        }
        catch (Error)
        {
            if (Error instanceof NoSessionError)
            {
                /* Not signed in yet (e.g. `useHighContrast` runs above the auth
                 * provider, before a session exists) — expected, not a bug. */
                SetSettings(Domain.Settings.DefaultAppSettings);
            }
            else
            {
                /* eslint-disable-next-line no-console */
                console.error("Failed to load settings", Error);
            }
        }
        finally
        {
            SetIsLoading(false);
        }
    }, [ ]);

    const Update = useCallback(async (Patch: Domain.Settings.AppSettings) =>
    {
        const Profile = await UpdateProfileSettings(Patch);

        SetSettings(Domain.Settings.WithDefaults(Profile.Settings));
    }, [ ]);

    useEffect(() =>
    {
        void Refetch();
    }, [ Refetch ]);

    return { IsLoading, Refetch, Settings, Update };
};
