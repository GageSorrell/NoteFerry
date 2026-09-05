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
       * @param Enabled Whether to fetch on mount. Defaults to `true`; pass `false`
       * while the caller doesn't yet know if a session exists (e.g. `useHighContrast`,
       * which runs while auth is still restoring) so this never sends a doomed
       * unauthenticated request — {@link Domain.Settings.DefaultAppSettings} is
       * returned until it flips to `true` and the real settings load. `Refetch` still
       * works regardless of `Enabled`.
       *
       * @category Settings
       * @since 1.0.0
       */
const useSettings = (Enabled = true): UseSettings =>
{
    const [ Settings, SetSettings ] =
        useState<Domain.Settings.ResolvedAppSettings>(Domain.Settings.DefaultAppSettings);

    const [ IsLoading, SetIsLoading ] = useState(Enabled);

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
                /* Not signed in — expected, not a bug. `Enabled` normally
                 * keeps this fetch from firing at all until a session is
                 * known to exist, but a manual `Refetch()` call can still
                 * race a sign-out. */
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
        if (Enabled)
        {
            void Refetch();
        }
    }, [ Enabled, Refetch ]);

    return { IsLoading, Refetch, Settings, Update };
};
