/**
 * Hook backing the data-source discovery screen for one connection: a live
 * Notion search (`Discovered`), the locally cached schemas (`Cached`), and a
 * `Cache` action that fetches + normalizes a data source's schema into the
 * cache. Thin wrapper over the typed API client; the component stays unaware
 * of HTTP.
 *
 * @module notivex/features/data-sources/use-data-sources
 *
 * @file      use-data-sources.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { ListDataSources, RefreshDataSource, SearchDataSources } from "@/Domain/Runtime/NotivexApi";
import { useCallback, useEffect, useState } from "react";

/** The state returned by {@link useDataSources}. */
export interface UseDataSources
{
    readonly Discovered: ReadonlyArray<Domain.DataSource.DiscoveredDataSource>;
    readonly Cached: ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>;

    /**
     * The number of active databases across *every* connection, not just
     * this one — the free-tier cap is enforced per-user, not per-workspace,
     * so a paywall check scoped to {@link Cached} alone would miss databases
     * already active in another workspace.
     */
    readonly GlobalActiveCount: number;
    readonly IsSearching: boolean;
    readonly IsLoadingCache: boolean;
    readonly BusyId: Domain.Id.NotionDataSourceId | null;
    readonly Search: () => Promise<void>;
    readonly Cache: (DataSourceId: Domain.Id.NotionDataSourceId) => Promise<void>;
}

/**
 * Loads a connection's discovered and cached data sources on mount, and exposes
 * a re-search plus a per-data-source cache action.
 *
 * @category DataSources
 * @since 1.0.0
 */
export const useDataSources = (ConnectionId: Domain.Id.NotionConnectionId): UseDataSources =>
{
    const [ Discovered, SetDiscovered ] =
        useState<ReadonlyArray<Domain.DataSource.DiscoveredDataSource>>([ ]);
    const [ Cached, SetCached ] =
        useState<ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>>([ ]);
    const [ GlobalActiveCount, SetGlobalActiveCount ] = useState(0);
    const [ IsSearching, SetIsSearching ] = useState(true);
    const [ IsLoadingCache, SetIsLoadingCache ] = useState(true);
    const [ BusyId, SetBusyId ] = useState<Domain.Id.NotionDataSourceId | null>(null);

    const LoadCache = useCallback(async () =>
    {
        SetIsLoadingCache(true);

        try
        {
            const All = await ListDataSources();

            SetCached(All.filter((Entry: Domain.DataSource.CachedDataSourceSchema) =>
                Entry.ConnectionId === ConnectionId));
            SetGlobalActiveCount(All.filter((Entry: Domain.DataSource.CachedDataSourceSchema) =>
                Entry.Access === "Available").length);
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to list cached data sources", Error);
        }
        finally
        {
            SetIsLoadingCache(false);
        }
    }, [ ConnectionId ]);

    const Search = useCallback(async () =>
    {
        SetIsSearching(true);

        try
        {
            SetDiscovered(await SearchDataSources(ConnectionId));
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to search Notion data sources", Error);
        }
        finally
        {
            SetIsSearching(false);
        }
    }, [ ConnectionId ]);

    const Cache = useCallback(async (DataSourceId: Domain.Id.NotionDataSourceId) =>
    {
        SetBusyId(DataSourceId);

        /* Errors propagate to the caller (rather than being swallowed here)
         * so the screen can distinguish a free-tier limit rejection from any
         * other failure and give the user feedback either way. */
        try
        {
            await RefreshDataSource(ConnectionId, DataSourceId);
            await LoadCache();
        }
        finally
        {
            SetBusyId(null);
        }
    }, [ ConnectionId, LoadCache ]);

    useEffect(() =>
    {
        Search();
        LoadCache();
    }, [ Search, LoadCache ]);

    return {
        BusyId,
        Cache,
        Cached,
        Discovered,
        GlobalActiveCount,
        IsLoadingCache,
        IsSearching,
        Search
    } as const;
};
