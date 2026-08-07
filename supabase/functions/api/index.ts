/**
 * The authenticated Notivex API (`verify_jwt = true`). Serves the shared
 * `@notivex/api` HttpApi contract via Effect so the app can use a derived,
 * fully typed client (ArchitectureInitialDraft.md §16).
 *
 * The `Connections` group is implemented; `DataSources`, `Destinations` and
 * `Pages` are stubbed with 501 so the contract stays whole and the client
 * covers every endpoint. Those groups land in later slices.
 *
 * @module notivex/functions/api
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import { AdminClient, PrivateSchema } from "../_shared/Database.ts";
import { Effect, Layer } from "effect";
import { Etag, HttpPlatform, HttpRouter, HttpServerResponse } from "effect/unstable/http";
import { BuildAuthorizationUrl } from "../_shared/Notion.ts";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { NotivexApi } from "@notivex/api";
import { RequireUser } from "../_shared/Authentication.ts";

/* Every not-yet-implemented endpoint returns a raw 501 response, which the
 * handler signature permits alongside the endpoint's declared success type. */
const NotImplemented = () =>
    Effect.succeed(HttpServerResponse.text("Not implemented", { status: 501 }));

/* eslint-disable-next-line jsdoc/require-jsdoc */
function ToNotionConnection(Row: Record<string, unknown>): Domain.NotionConnection.NotionConnection
{
    return {
        BotId: Row.bot_id as string,
        ConnectedAt: new Date(Row.connected_at as string),
        Id: Row.id as Domain.Id.NotionConnectionId,
        ...(Row.last_used_at ? { LastUsedAt: new Date(Row.last_used_at as string) } : {}),
        ...(Row.notion_owner_user_id ? { NotionOwnerUserId: Row.notion_owner_user_id as string } : {}),
        ...(Row.revoked_at ? { RevokedAt: new Date(Row.revoked_at as string) } : {}),
        Status: Row.status as Domain.NotionConnection.NotionConnectionStatus,
        UserId: Row.user_id as Domain.Id.UserId,
        ...(Row.workspace_icon_url ? { WorkspaceIconUrl: Row.workspace_icon_url as string } : {}),
        WorkspaceId: Row.workspace_id as Domain.Id.NotionWorkspaceId,
        WorkspaceName: Row.workspace_name as string
    };
}

const ConnectionsLive = HttpApiBuilder.group(NotivexApi, "Connections", (Handlers) =>
    Handlers
        .handle("List", () =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;
                const { data, error } = yield* Effect.promise(async () =>
                    await AdminClient
                        .from("notion_connections")
                        .select("*")
                        .eq("user_id", UserId)
                        .order("connected_at", { ascending: false }));

                if (error)
                {
                    return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
                }

                return (data ?? []).map(ToNotionConnection);
            }))
        .handle("StartAuthorization", () =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                const ClientId = Deno.env.get("NOTION_OAUTH_CLIENT_ID");

                if (!ClientId)
                {
                    return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: "NOTION_OAUTH_CLIENT_ID is not set." }));
                }

                const State = crypto.randomUUID();
                const ExpiresAt = new Date(Date.now() + (10 * 60 * 1000)).toISOString();

                const { error } = yield* Effect.promise(async () =>
                    await PrivateSchema
                        .from("notion_oauth_states")
                        .insert({ expires_at: ExpiresAt, state: State, user_id: UserId }));

                if (error)
                {
                    return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
                }

                return {
                    AuthorizationUrl: BuildAuthorizationUrl({
                        ClientId,
                        RedirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/notion-oauth-callback`,
                        State
                    })
                };
            }))
        .handle("Disconnect", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;
                const ConnectionId = Input.params.ConnectionId;

                const { data, error } = yield* Effect.promise(async () =>
                    await AdminClient
                        .from("notion_connections")
                        .update({ revoked_at: new Date().toISOString(), status: "Revoked" })
                        .eq("id", ConnectionId)
                        .eq("user_id", UserId)
                        .select("id")
                        .maybeSingle());

                if (error)
                {
                    return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
                }

                if (!data)
                {
                    return yield* Effect.fail(new Domain.Error.NotionConnectionNotFound({ ConnectionId }));
                }

                yield* Effect.promise(async () =>
                    await PrivateSchema
                        .from("notion_connection_credentials")
                        .delete()
                        .eq("connection_id", ConnectionId));
            })));

const DataSourcesLive = HttpApiBuilder.group(NotivexApi, "DataSources", (Handlers) =>
    Handlers
        .handle("List", NotImplemented)
        .handle("Refresh", NotImplemented)
        .handle("Get", NotImplemented));

const DestinationsLive = HttpApiBuilder.group(NotivexApi, "Destinations", (Handlers) =>
    Handlers
        .handle("List", NotImplemented)
        .handle("Create", NotImplemented)
        .handle("Update", NotImplemented)
        .handle("Delete", NotImplemented));

const PagesLive = HttpApiBuilder.group(NotivexApi, "Pages", (Handlers) =>
    Handlers.handle("Create", NotImplemented));

/* The web platform services the served HttpApi needs. Edge functions never
 * serve files, so a no-op FileSystem is sufficient. */
const PlatformLayer = Layer.mergeAll(
    Path.layer,
    Etag.layer,
    HttpPlatform.layer
).pipe(Layer.provideMerge(FileSystem.layerNoop({})));

const AppLayer = HttpApiBuilder.layer(NotivexApi).pipe(
    Layer.provide(ConnectionsLive),
    Layer.provide(DataSourcesLive),
    Layer.provide(DestinationsLive),
    Layer.provide(PagesLive),
    Layer.provide(PlatformLayer)
);

const { handler } = HttpRouter.toWebHandler(AppLayer);

Deno.serve(handler);
