/**
 * The typed Notivex API client, derived from the shared `@notivex/api` HttpApi
 * contract (ArchitectureInitialDraft.md §16). The same schemas that type the
 * `api` edge function type these calls, so request/response shapes cannot drift.
 *
 * Each call attaches the current Supabase session as a bearer token and runs the
 * Effect to a Promise at the React boundary (§34).
 *
 * @module notivex/Domain/Runtime/NotivexApi
 *
 * @file      NotivexApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/unstable/http";
import { Effect } from "effect";
import { HttpApiClient } from "effect/unstable/httpapi";
import { NotivexApi } from "@notivex/api";
import { Supabase } from "./Supabase";

const baseUrl = `${ process.env.EXPO_PUBLIC_SUPABASE_URL }/functions/v1/api`;

/* eslint-disable-next-line jsdoc/require-jsdoc */
async function AccessToken(): Promise<string>
{
    const { data } = await Supabase.auth.getSession();

    return data.session?.access_token ?? "";
}

const MakeClient = (Token: string) =>
{
    return HttpApiClient.make(
        NotivexApi,
        {
            baseUrl,
            transformClient: HttpClient.mapRequest(
                HttpClientRequest.setHeader("Authorization", `Bearer ${ Token }`)
            )
        }
    );
};

export/**
       * Every Notion connection the current user has authorized.
       *
       * @category Api
       * @since 1.0.0
       */
const ListConnections = async (): Promise<ReadonlyArray<Domain.NotionConnection.NotionConnection>> =>
{
    const Token = await AccessToken();

    return Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Connections.List();
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

export/**
       * Begins the Notion OAuth flow and returns the authorization URL to open.
       *
       * @category Api
       * @since 1.0.0
       */
const StartNotionAuthorization = async (): Promise<string> =>
{
    const Token = await AccessToken();

    return Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);
            const Result = yield* Client.Connections.StartAuthorization();

            return Result.AuthorizationUrl;
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

export/**
       * Disconnects (revokes) one of the current user's Notion connections.
       *
       * @category Api
       * @since 1.0.0
       */
const DisconnectNotion = async (ConnectionId: Domain.Id.NotionConnectionId): Promise<void> =>
{
    const Token = await AccessToken();

    await Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            yield* Client.Connections.Disconnect({ params: { ConnectionId } });
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

export/**
       * Discovers the data sources a connection can currently see in Notion
       * (a live search, not the cache).
       *
       * @category Api
       * @since 1.0.0
       */
const SearchDataSources = async (
    ConnectionId: Domain.Id.NotionConnectionId
): Promise<ReadonlyArray<Domain.DataSource.DiscoveredDataSource>> =>
{
    const Token = await AccessToken();

    return Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.Search({ params: { ConnectionId } });
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

export/**
       * Every data source cached for the current user's connections.
       *
       * @category Api
       * @since 1.0.0
       */
const ListDataSources = async (): Promise<ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>> =>
{
    const Token = await AccessToken();

    return Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.List();
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

export/**
       * Fetches a data source's schema from Notion and caches it, returning the
       * fresh normalized schema.
       *
       * @category Api
       * @since 1.0.0
       */
const RefreshDataSource = async (
    ConnectionId: Domain.Id.NotionConnectionId,
    DataSourceId: Domain.Id.NotionDataSourceId
): Promise<Domain.DataSource.CachedDataSourceSchema> =>
{
    const Token = await AccessToken();

    return Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.Refresh({ payload: { ConnectionId, DataSourceId } });
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

export/**
       * Reads one cached data source's normalized schema.
       *
       * @category Api
       * @since 1.0.0
       */
const GetDataSource = async (
    DataSourceId: Domain.Id.NotionDataSourceId
): Promise<Domain.DataSource.CachedDataSourceSchema> =>
{
    const Token = await AccessToken();

    return Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.Get({ params: { DataSourceId } });
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

export/**
       * Every quick-entry destination the current user has configured.
       *
       * @category Api
       * @since 1.0.0
       */
const ListDestinations = async (): Promise<ReadonlyArray<Domain.Destination.Destination>> =>
{
    const Token = await AccessToken();

    return Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Destinations.List();
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

/** The fields the client supplies to create a destination. */
export interface CreateDestinationInput
{
    readonly ConnectionId: Domain.Id.NotionConnectionId;
    readonly DataSourceId: Domain.Id.NotionDataSourceId;
    readonly FieldConfiguration: Domain.Destination.FieldConfiguration;
    readonly Icon?: string | undefined;
    readonly Name: string;
    readonly Position: number;
    readonly Template: Domain.Destination.DestinationTemplate;
}

export/**
       * Creates a quick-entry destination for a cached data source.
       *
       * @category Api
       * @since 1.0.0
       */
const CreateDestination = async (
    Input: CreateDestinationInput
): Promise<Domain.Destination.Destination> =>
{
    const Token = await AccessToken();

    return Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Destinations.Create({ payload: Input });
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};

export/**
       * Deletes a quick-entry destination.
       *
       * @category Api
       * @since 1.0.0
       */
const DeleteDestination = async (DestinationId: Domain.Id.DestinationId): Promise<void> =>
{
    const Token = await AccessToken();

    await Effect.runPromise(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            yield* Client.Destinations.Delete({ params: { DestinationId } });
        }).pipe(Effect.provide(FetchHttpClient.layer))
    );
};
