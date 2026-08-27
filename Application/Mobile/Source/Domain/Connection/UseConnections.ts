/**
 * Hook exposing the current user's Notion connections and cached databases.
 * It refreshes the databases visible to each active connection so cached
 * schema and visual metadata remain current; the component tree stays unaware
 * of HTTP and Notion discovery.
 *
 * @module noteferry/Domain/Connection/UseConnections
 *
 * @file      UseConnections.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import {
    ListConnections,
    ListDataSources,
    RefreshDataSource
} from "@/Domain/Runtime/NoteFerryApi";
import { useCallback, useEffect, useState } from "react";

/** The state returned by {@link useConnections}. */
export interface UseConnections
{
    readonly Connections: ReadonlyArray<Domain.NotionConnection.NotionConnection>;
    readonly DataSources: ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>;
    readonly IsLoading: boolean;
    readonly Refetch: () => Promise<void>;
}

export/**
       * Loads the current user's Notion connections and selected databases on mount.
       * Only those selected databases are refreshed so discovery cannot silently add
       * databases the user left unchecked during onboarding.
       *
       * @category Connections
       * @since 1.0.0
       */
const useConnections = (): UseConnections =>
{
    const [ Connections, SetConnections ] =
        useState<ReadonlyArray<Domain.NotionConnection.NotionConnection>>([ ]);
    const [ DataSources, SetDataSources ] =
        useState<ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>>([ ]);
    const [ IsLoading, SetIsLoading ] = useState(true);

    const Refetch = useCallback(async () =>
    {
        SetIsLoading(true);

        try
        {
            const NextConnections = await ListConnections();

            SetConnections(NextConnections);

            try
            {
                let Cached = await ListDataSources();

                SetDataSources(Cached);

                if (Cached.length > 0)
                {
                    await Promise.allSettled(Cached.map((
                        Source: Domain.DataSource.CachedDataSourceSchema
                    ) =>
                        RefreshDataSource(Source.ConnectionId, Source.DataSourceId)));
                    Cached = await ListDataSources();
                    SetDataSources(Cached);
                }
            }
            catch (Error)
            {
                /* Keep the connection list usable even if Notion discovery or
                 * schema caching fails for one workspace. */
                /* eslint-disable-next-line no-console */
                console.error("Failed to load Notion databases", Error);
            }
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to list Notion connections", Error);
        }
        finally
        {
            SetIsLoading(false);
        }
    }, [ ]);

    useEffect(() =>
    {
        /* Loading remote connection state is the external synchronization this
         * mount effect owns. */
        void Refetch();
    }, [ Refetch ]);

    return { Connections, DataSources, IsLoading, Refetch };
};
