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
import { Effect, pipe } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/unstable/http";
import { HttpApiClient } from "effect/unstable/httpapi";
import { NotivexApi } from "@notivex/api";
import { Supabase } from "./Supabase";

const baseUrl = `${ process.env.EXPO_PUBLIC_SUPABASE_URL }/functions/v1/api`;

const GetAccessToken = async (): Promise<string> =>
{
    const { data } = await Supabase.auth.getSession();

    return data.session?.access_token ?? "";
};

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
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Connections.List();
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Begins the Notion OAuth flow and returns the authorization URL to open.
       *
       * @category Api
       * @since 1.0.0
       */
const StartNotionAuthorization = async (): Promise<string> =>
{
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);
            const Result = yield* Client.Connections.StartAuthorization();

            return Result.AuthorizationUrl;
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Disconnects (revokes) one of the current user's Notion connections.
       *
       * @category Api
       * @since 1.0.0
       */
const DisconnectNotion = async (ConnectionId: Domain.Id.NotionConnectionId): Promise<void> =>
{
    const Token = await GetAccessToken();

    await Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            yield* Client.Connections.Disconnect({ params: { ConnectionId } });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
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
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.Search({ params: { ConnectionId } });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Discovers the pages and databases used to classify the
       * post-authorization onboarding result, including capped database row
       * counts.
       *
       * @category Api
       * @since 1.0.0
       */
const DiscoverOnboarding = async (
    ConnectionId: Domain.Id.NotionConnectionId
): Promise<Domain.DataSource.OnboardingDiscovery> =>
{
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.DiscoverOnboarding({
                params: { ConnectionId }
            });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Every data source cached for the current user's connections.
       *
       * @category Api
       * @since 1.0.0
       */
const ListDataSources = async (): Promise<ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>> =>
{
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.List();
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
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
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.Refresh({ payload: { ConnectionId, DataSourceId } });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
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
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.DataSources.Get({ params: { DataSourceId } });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Every quick-entry destination the current user has configured.
       *
       * @category Api
       * @since 1.0.0
       */
const ListDestinations = async (): Promise<ReadonlyArray<Domain.Destination.Destination>> =>
{
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Destinations.List();
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
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
    readonly PostCreationBehavior?: Domain.Behavior.PostCreationBehavior | undefined;
    readonly Template: Domain.Destination.DestinationTemplate;
}

/** The fields the client may change on an existing destination. */
export interface UpdateDestinationInput
{
    readonly FieldConfiguration?: Domain.Destination.FieldConfiguration | undefined;
    readonly Icon?: string | undefined;
    readonly Name?: string | undefined;
    readonly Position?: number | undefined;
    readonly PostCreationBehavior?: Domain.Behavior.PostCreationBehavior | undefined;
    readonly Template?: Domain.Destination.DestinationTemplate | undefined;
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
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Destinations.Create({ payload: Input });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Updates a quick-entry destination's presentation or field configuration.
       *
       * @category Api
       * @since 1.0.0
       */
const UpdateDestination = async (
    DestinationId: Domain.Id.DestinationId,
    Input: UpdateDestinationInput
): Promise<Domain.Destination.Destination> =>
{
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Destinations.Update({
                params: { DestinationId },
                payload: Input
            });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Deletes a quick-entry destination.
       *
       * @category Api
       * @since 1.0.0
       */
const DeleteDestination = async (DestinationId: Domain.Id.DestinationId): Promise<void> =>
{
    const Token = await GetAccessToken();

    await Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            yield* Client.Destinations.Delete({ params: { DestinationId } });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Creates a Notion page using a configured quick-entry destination.
       *
       * @category Api
       * @since 1.0.0
       */
const CreatePage = async (
    Command: Domain.Command.CreatePageCommand
): Promise<Domain.Command.CreatePageResult> =>
{
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Pages.Create({ payload: Command });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * The current user's profile, including their resolved app-wide settings.
       *
       * @category Api
       * @since 1.0.0
       */
const GetProfile = async (): Promise<Domain.Profile.Profile> =>
{
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Profile.Get();
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Merges a partial settings update into the current user's profile.
       *
       * @category Api
       * @since 1.0.0
       */
const UpdateProfileSettings = async (
    Patch: Domain.Settings.AppSettings
): Promise<Domain.Profile.Profile> =>
{
    const Token = await GetAccessToken();

    return Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            return yield* Client.Profile.UpdateSettings({ payload: Patch });
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Permanently deletes the current user's account. Irreversible.
       *
       * @category Api
       * @since 1.0.0
       */
const DeleteAccount = async (): Promise<void> =>
{
    const Token = await GetAccessToken();

    await Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            yield* Client.Account.Delete();
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};

export/**
       * Requests a copy of the current user's account data. Fulfilled
       * manually — this only records the request.
       *
       * @category Api
       * @since 1.0.0
       */
const RequestAccountData = async (): Promise<void> =>
{
    const Token = await GetAccessToken();

    await Effect.runPromise(pipe(
        Effect.gen(function* ()
        {
            const Client = yield* MakeClient(Token);

            yield* Client.ExportRequests.Create();
        }),
        Effect.provide(FetchHttpClient.layer)
    ));
};
