/**
 * The typed Notivex API client, derived from the shared `@notivex/api` HttpApi
 * contract (ArchitectureInitialDraft.md §16). The same schemas that type the
 * `api` edge function type these calls, so request/response shapes cannot drift.
 *
 * Each call attaches the current Supabase session as a bearer token and runs the
 * Effect to a Promise at the React boundary (§34).
 *
 * @module notivex/runtime/notivex-api
 *
 * @file      notivex-api.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/unstable/http";
import { Effect } from "effect";
import { HttpApiClient } from "effect/unstable/httpapi";
import { NotivexApi } from "@notivex/api";
import { Supabase } from "./supabase";

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
