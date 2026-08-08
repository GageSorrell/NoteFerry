/**
 * Hook backing the data-source discovery screen for one connection: a live
 * Notion search (`Discovered`), the locally cached schemas (`Cached`), and a
 * `Cache` action that fetches + normalizes a data source's schema into the
 * cache. Thin wrapper over the typed API client; the component stays unaware
 * of HTTP (ArchitectureInitialDraft.md §16, §36).
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
export function useDataSources(ConnectionId: Domain.Id.NotionConnectionId): UseDataSources
{
    const [ Discovered, SetDiscovered ] =
        useState<ReadonlyArray<Domain.DataSource.DiscoveredDataSource>>([ ]);
    const [ Cached, SetCached ] =
        useState<ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>>([ ]);
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

        try
        {
            await RefreshDataSource(ConnectionId, DataSourceId);
            await LoadCache();
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to cache data source", Error);
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
        IsLoadingCache,
        IsSearching,
        Search
    } as const;
}
