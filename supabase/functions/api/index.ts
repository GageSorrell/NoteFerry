/**
 * The authenticated NoteFerry API (`verify_jwt = true`). Serves the shared
 * `@noteferry/api` HttpApi contract via Effect so the app can use a derived,
 * fully typed client.
 *
 * Every group — `Connections`, `DataSources`, `Destinations` and `Pages` — is
 * implemented against the shared `@noteferry/api` contract.
 *
 * @module noteferry/functions/api
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Account from "../_shared/Account.ts";
import * as DataSources from "../_shared/DataSources.ts";
import * as Destinations from "../_shared/Destinations.ts";
import * as Domain from "@noteferry/domain";
import * as ExportRequests from "../_shared/ExportRequests.ts";
import * as Feedback from "../_shared/Feedback.ts";
import * as FileSystem from "effect/FileSystem";
import * as Notion from "../_shared/Notion.ts";
import * as Pages from "../_shared/Pages.ts";
import * as Path from "effect/Path";
import * as Profile from "../_shared/Profile.ts";
import * as Subscriptions from "../_shared/Subscriptions.ts";
import { AdminClient, PrivateSchema } from "../_shared/Database.ts";
import { Effect, Layer } from "effect";
import { Etag, HttpPlatform, HttpRouter } from "effect/unstable/http";
import { BuildAuthorizationUrl } from "../_shared/Notion.ts";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { NoteFerryApi } from "@noteferry/api";
import { RequireUser } from "../_shared/Authentication.ts";

/* eslint-disable-next-line jsdoc/require-jsdoc */
const ToNotionConnection = (Row: Record<string, unknown>): Domain.NotionConnection.NotionConnection =>
{
    return {
        BotId: Row.bot_id as string,
        ConnectedAt: new Date(Row.connected_at as string),
        Id: Row.id as Domain.Id.NotionConnectionId,
        ...(Row.last_used_at ? { LastUsedAt: new Date(Row.last_used_at as string) } : {}),
        ...(Row.notion_owner_avatar_url
            ? { NotionOwnerAvatarUrl: Row.notion_owner_avatar_url as string }
            : {}),
        ...(Row.notion_owner_user_id ? { NotionOwnerUserId: Row.notion_owner_user_id as string } : {}),
        ...(Row.revoked_at ? { RevokedAt: new Date(Row.revoked_at as string) } : {}),
        Status: Row.status as Domain.NotionConnection.NotionConnectionStatus,
        UserId: Row.user_id as Domain.Id.UserId,
        ...(Row.workspace_icon_url ? { WorkspaceIconUrl: Row.workspace_icon_url as string } : {}),
        WorkspaceId: Row.workspace_id as Domain.Id.NotionWorkspaceId,
        WorkspaceName: Row.workspace_name as string
    };
};

/* eslint-disable-next-line jsdoc/require-jsdoc */
const MapNotionAuthorizationError = (Error_: unknown) =>
{
    if (Error_ instanceof Notion.NotionApiError)
    {
        if (Error_.Status === 401 || Error_.Status === 403)
        {
            return new Domain.Error.NotionUnauthorized({ Message: Error_.Body });
        }

        if (Error_.Status === 429)
        {
            return new Domain.Error.NotionRateLimited({
                ...(Error_.RetryAfterSeconds === undefined
                    ? { }
                    : { RetryAfterSeconds: Error_.RetryAfterSeconds })
            });
        }

        return new Domain.Error.NotionUnavailable({ Message: Error_.Body });
    }

    return new Domain.Error.NetworkError({ Message: String(Error_) });
};

const ConnectionsLive = HttpApiBuilder.group(NoteFerryApi, "Connections", (Handlers) =>
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
        .handle("AdoptAuthorization", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;
                const Bot = yield* Effect.tryPromise({
                    catch: MapNotionAuthorizationError,
                    try: async () => await Notion.RetrieveBotUser(Input.payload.ProviderToken)
                });
                const { data: Connection, error: ConnectionError } =
                    yield* Effect.promise(async () => await AdminClient
                        .from("notion_connections")
                        .upsert(
                            {
                                bot_id: Bot.id,
                                notion_owner_avatar_url:
                                    Bot.bot.owner.user?.avatar_url ?? null,
                                notion_owner_user_id: Bot.bot.owner.user?.id ?? null,
                                revoked_at: null,
                                status: "Active",
                                user_id: UserId,
                                workspace_id: Bot.bot.workspace_id,
                                workspace_name: Bot.bot.workspace_name ?? "Notion workspace"
                            },
                            { onConflict: "user_id,bot_id" }
                        )
                        .select("id")
                        .single());

                if (ConnectionError || !Connection)
                {
                    return yield* Effect.fail(new Domain.Error.DatabaseError({
                        Message: ConnectionError?.message ?? "Failed to persist the Notion connection."
                    }));
                }

                const { data: ExistingCredential, error: ExistingCredentialError } =
                    yield* Effect.promise(async () => await PrivateSchema
                        .from("notion_connection_credentials")
                        .select("refresh_token")
                        .eq("connection_id", Connection.id)
                        .maybeSingle());

                if (ExistingCredentialError)
                {
                    return yield* Effect.fail(new Domain.Error.DatabaseError({
                        Message: ExistingCredentialError.message
                    }));
                }

                const { error: CredentialError } = yield* Effect.promise(async () =>
                    await PrivateSchema
                        .from("notion_connection_credentials")
                        .upsert(
                            {
                                access_token: Input.payload.ProviderToken,
                                connection_id: Connection.id,
                                refresh_token: Input.payload.ProviderRefreshToken
                                    ?? ExistingCredential?.refresh_token
                                    ?? null
                            },
                            { onConflict: "connection_id" }
                        ));

                if (CredentialError)
                {
                    return yield* Effect.fail(new Domain.Error.DatabaseError({
                        Message: CredentialError.message
                    }));
                }
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

const DataSourcesLive = HttpApiBuilder.group(NoteFerryApi, "DataSources", (Handlers) =>
    Handlers
        .handle("Search", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* DataSources.SearchForUser(UserId, Input.params.ConnectionId);
            }))
        .handle("DiscoverOnboarding", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* DataSources.DiscoverOnboardingForUser(
                    UserId,
                    Input.params.ConnectionId
                );
            }))
        .handle("List", () =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* DataSources.ListForUser(UserId);
            }))
        .handle("Refresh", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* DataSources.RefreshForUser(UserId, Input.payload.ConnectionId, Input.payload.DataSourceId);
            }))
        .handle("Get", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* DataSources.GetForUser(UserId, Input.params.DataSourceId);
            }))
        .handle("SwapFreeActive", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* DataSources.SwapFreeActiveForUser(
                    UserId,
                    Input.payload.ActivateDataSourceId,
                    Input.payload.LockDataSourceId
                );
            }))
        .handle("Remove", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                yield* DataSources.RemoveForUser(UserId, Input.params.DataSourceId);
            })));

const DestinationsLive = HttpApiBuilder.group(NoteFerryApi, "Destinations", (Handlers) =>
    Handlers
        .handle("List", () =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* Destinations.ListForUser(UserId);
            }))
        .handle("Create", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* Destinations.CreateForUser(UserId, Input.payload);
            }))
        .handle("Update", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* Destinations.UpdateForUser(UserId, Input.params.DestinationId, Input.payload);
            }))
        .handle("Delete", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                yield* Destinations.DeleteForUser(UserId, Input.params.DestinationId);
            })));

const PagesLive = HttpApiBuilder.group(NoteFerryApi, "Pages", (Handlers) =>
    Handlers.handle("Create", (Input) =>
        Effect.gen(function* ()
        {
            const UserId = yield* RequireUser;

            return yield* Pages.CreateForUser(UserId, Input.payload);
        })));

const ProfileLive = HttpApiBuilder.group(NoteFerryApi, "Profile", (Handlers) =>
    Handlers
        .handle("Get", () =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* Profile.GetForUser(UserId);
            }))
        .handle("UpdateSettings", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* Profile.UpdateSettingsForUser(UserId, Input.payload);
            })));

const AccountLive = HttpApiBuilder.group(NoteFerryApi, "Account", (Handlers) =>
    Handlers.handle("Delete", () =>
        Effect.gen(function* ()
        {
            const UserId = yield* RequireUser;

            yield* Account.DeleteForUser(UserId);
        })));

const ExportRequestsLive = HttpApiBuilder.group(NoteFerryApi, "ExportRequests", (Handlers) =>
    Handlers.handle("Create", () =>
        Effect.gen(function* ()
        {
            const UserId = yield* RequireUser;

            yield* ExportRequests.CreateForUser(UserId);
        })));

const FeedbackLive = HttpApiBuilder.group(NoteFerryApi, "Feedback", (Handlers) =>
    Handlers.handle("Create", (Input) =>
        Effect.gen(function* ()
        {
            const UserId = yield* RequireUser;

            yield* Feedback.CreateForUser(UserId, Input.payload);
        })));

const SubscriptionsLive = HttpApiBuilder.group(NoteFerryApi, "Subscriptions", (Handlers) =>
    Handlers
        .handle("Status", () =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* Subscriptions.GetForUser(UserId);
            }))
        .handle("Allowance", () =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* Subscriptions.GetAllowanceForUser(UserId);
            }))
        .handle("Refresh", () =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                return yield* Subscriptions.RefreshFromRevenueCat(UserId);
            }))
        .handle("Sale", () =>
            Effect.gen(function* ()
            {
                yield* RequireUser;

                return yield* Subscriptions.GetActiveSale();
            }))
        .handle("RegisterDevice", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                yield* Subscriptions.RegisterDeviceForUser(
                    UserId,
                    Input.payload.DeviceId,
                    Input.payload.Platform,
                    Input.payload.PushToken
                );
            }))
        .handle("RemoveDevice", (Input) =>
            Effect.gen(function* ()
            {
                const UserId = yield* RequireUser;

                yield* Subscriptions.RemoveDeviceForUser(UserId, Input.payload.DeviceId);
            })));

/* The web platform services the served HttpApi needs. Edge functions never
 * serve files, so a no-op FileSystem is sufficient. */
const PlatformLayer = Layer.mergeAll(
    Path.layer,
    Etag.layer,
    HttpPlatform.layer
).pipe(Layer.provideMerge(FileSystem.layerNoop({})));

const AppLayer = HttpApiBuilder.layer(NoteFerryApi).pipe(
    Layer.provide(ConnectionsLive),
    Layer.provide(DataSourcesLive),
    Layer.provide(DestinationsLive),
    Layer.provide(PagesLive),
    Layer.provide(ProfileLive),
    Layer.provide(AccountLive),
    Layer.provide(ExportRequestsLive),
    Layer.provide(FeedbackLive),
    Layer.provide(SubscriptionsLive),
    Layer.provide(PlatformLayer)
);

const { handler } = HttpRouter.toWebHandler(AppLayer);

/* Supabase mounts this function under `.../functions/v1/api`, so the request
 * path arrives prefixed with the function name (`/api/...`). Strip that prefix
 * so it matches the HttpApi routes, which begin at each group's prefix (e.g.
 * `/Connections`). */
Deno.serve((Request_: Request) =>
{
    const Url = new URL(Request_.url);
    const Marker = "/api";
    const Index = Url.pathname.indexOf(Marker);

    if (Index >= 0)
    {
        Url.pathname = Url.pathname.slice(Index + Marker.length) || "/";
    }

    return handler(new Request(Url.toString(), Request_ as unknown as RequestInit));
});
