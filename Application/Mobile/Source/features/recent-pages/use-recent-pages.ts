/**
 * Loads the current user's recent NoteFerry-created pages.
 */

import type * as Domain from "@noteferry/domain";
import { ListRecentPages } from "@/Domain/Runtime/NoteFerryApi";
import { useCallback, useEffect, useState } from "react";

export interface UseRecentPages
{
    readonly IsLoading: boolean;
    readonly RecentPages: readonly Domain.Page.RecentPage[];
    readonly Refetch: (Silent?: boolean) => Promise<void>;
}

export const useRecentPages = (Enabled: boolean): UseRecentPages =>
{
    const [ RecentPages, SetRecentPages ] =
        useState<readonly Domain.Page.RecentPage[]>([ ]);
    const [ IsLoading, SetIsLoading ] = useState(Enabled);

    const Refetch = useCallback(async (Silent = false): Promise<void> =>
    {
        if (!Enabled)
        {
            SetRecentPages([ ]);
            SetIsLoading(false);
            return;
        }

        if (!Silent)
        {
            SetIsLoading(true);
        }

        try
        {
            SetRecentPages(await ListRecentPages());
        }
        catch (Error)
        {
            /* Keep the Home screen usable when the optional feed is unavailable. */
            console.error("Failed to list recent pages", Error);
        }
        finally
        {
            if (!Silent)
            {
                SetIsLoading(false);
            }
        }
    }, [ Enabled ]);

    useEffect(() =>
    {
        /* The effect starts the initial network request; the request itself
         * owns the resulting state updates. */
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
        void Refetch();
    }, [ Refetch ]);

    return { IsLoading, RecentPages, Refetch };
};
