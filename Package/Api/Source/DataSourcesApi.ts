/**
 * The `DataSources` group: reading and refreshing the normalized, cached
 * Notion data-source schemas that drive Notivex's quick-add forms.
 *
 * @module @notivex/api/DataSourcesApi
 *
 * @file      DataSourcesApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { Schema } from "effect";

export/**
       * Which connection's data source to (re)fetch from Notion.
       *
       * @category DataSources
       * @since 1.0.0
       */
const RefreshDataSourcePayload = Schema.Struct({
    ConnectionId: Domain.Id.NotionConnectionId,
    DataSourceId: Domain.Id.NotionDataSourceId
});

/** {@inheritDoc RefreshDataSourcePayload:var} */
export type RefreshDataSourcePayload = typeof RefreshDataSourcePayload.Type;

export/**
       * Discover the data sources a connection can currently see in Notion,
       * without caching them. This is how a user finds a data source to cache
       * (via {@link Refresh}) in the first place — the cache endpoints below all
       * assume a `DataSourceId` you already have.
       *
       * @category DataSources
       * @since 1.0.0
       */
const Search = HttpApiEndpoint.get(
    "Search",
    "/Search/:ConnectionId",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.NotionConnectionNotFound,
            Domain.Error.NotionConnectionRevoked,
            Domain.Error.NotionUnauthorized,
            Domain.Error.NotionRateLimited,
            Domain.Error.NotionUnavailable,
            Domain.Error.DatabaseError
        ],
        params:
        {
            ConnectionId: Domain.Id.NotionConnectionId
        },
        success: Schema.Array(Domain.DataSource.DiscoveredDataSource)
    }
);

export/**
       * Discovers the regular pages and databases visible to a connection for
       * the post-authorization onboarding result. The server also retrieves
       * each displayed database's page count, capped at 100.
       *
       * @category DataSources
       * @since 1.0.0
       */
const DiscoverOnboarding = HttpApiEndpoint.get(
    "DiscoverOnboarding",
    "/Onboarding/:ConnectionId",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.NotionConnectionNotFound,
            Domain.Error.NotionConnectionRevoked,
            Domain.Error.NotionUnauthorized,
            Domain.Error.NotionRateLimited,
            Domain.Error.NotionUnavailable,
            Domain.Error.DatabaseError
        ],
        params:
        {
            ConnectionId: Domain.Id.NotionConnectionId
        },
        success: Domain.DataSource.OnboardingDiscovery
    }
);

export/**
       * Every data source cached for the current user's connections.
       *
       * @category DataSources
       * @since 1.0.0
       */
const List = HttpApiEndpoint.get(
    "List",
    "/",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DatabaseError
        ],
        success: Schema.Array(Domain.DataSource.CachedDataSourceSchema)
    }
);

export/**
       * Re-fetch a data source's schema from Notion and refresh the cache,
       * reconciling any affected destinations by property id.
       *
       * @category DataSources
       * @since 1.0.0
       */
const Refresh = HttpApiEndpoint.post(
    "Refresh",
    "/Refresh",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.NotionConnectionNotFound,
            Domain.Error.NotionConnectionRevoked,
            Domain.Error.DataSourceNotFound,
            Domain.Error.NotionResourceNotShared,
            Domain.Error.NotionUnauthorized,
            Domain.Error.NotionRateLimited,
            Domain.Error.NotionUnavailable,
            Domain.Error.FreeDatabaseLimitReached,
            Domain.Error.DatabaseError
        ],
        payload: RefreshDataSourcePayload,
        success: Domain.DataSource.CachedDataSourceSchema
    }
);

export/**
       * Read a single cached data source's schema.
       *
       * @category DataSources
       * @since 1.0.0
       */
const Get = HttpApiEndpoint.get(
    "Get",
    "/:DataSourceId",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DataSourceNotFound,
            Domain.Error.DatabaseError
        ],
        params:
        {
            DataSourceId: Domain.Id.NotionDataSourceId
        },
        success: Domain.DataSource.CachedDataSourceSchema
    }
);

export const SwapFreeActivePayload = Schema.Struct({
    ActivateDataSourceId: Domain.Id.NotionDataSourceId,
    LockDataSourceId: Domain.Id.NotionDataSourceId
});

const SwapFreeActive = HttpApiEndpoint.post("SwapFreeActive", "/SwapFreeActive", {
    error: [
        Domain.Error.AuthenticationRequired,
        Domain.Error.DataSourceNotFound,
        Domain.Error.DatabaseError
    ],
    payload: SwapFreeActivePayload,
    success: Schema.Array(Domain.DataSource.CachedDataSourceSchema)
});

const Remove = HttpApiEndpoint.post("Remove", "/:DataSourceId/Remove", {
    error: [
        Domain.Error.AuthenticationRequired,
        Domain.Error.DataSourceNotFound,
        Domain.Error.DatabaseError
    ],
    params: { DataSourceId: Domain.Id.NotionDataSourceId },
    success: Schema.Void
});

export/**
       * The `DataSources` resource group of the Notivex API.
       *
       * @category DataSources
       * @since 1.0.0
       */
const DataSourcesApi = HttpApiGroup.make("DataSources").add(
    Search,
    DiscoverOnboarding,
    List,
    Refresh,
    Get,
    SwapFreeActive,
    Remove
);
