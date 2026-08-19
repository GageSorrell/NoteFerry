/**
 * Shared server helpers for authenticating Notion Data API calls on behalf of
 * a connection: loading its stored access/refresh tokens (verifying ownership
 * and status) and running a call with a one-shot token refresh on 401. Used by
 * both the data-source and page slices.
 *
 * @module notivex/functions/_shared/NotionAuth
 *
 * @file      NotionAuth.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import * as Notion from "./Notion.ts";
import { AdminClient, PrivateSchema } from "./Database.ts";
import { Effect } from "effect";

/** A connection's Notion tokens, as loaded from the `private` schema. */
export interface ConnectionTokens
{
    readonly AccessToken: string;
    readonly RefreshToken: string | null;
}

/**
 * Loads a connection's Notion tokens, failing if the connection is missing,
 * not owned by the user, revoked, or has no stored credentials.
 *
 * @category NotionAuth
 * @since 1.0.0
 */
export function LoadConnectionTokens(UserId: string, ConnectionId: string)
{
    return Effect.gen(function* ()
    {
        const { data: Connection, error: ConnectionError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("notion_connections")
                .select("id, status")
                .eq("id", ConnectionId)
                .eq("user_id", UserId)
                .maybeSingle());

        if (ConnectionError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: ConnectionError.message }));
        }

        if (!Connection)
        {
            return yield* Effect.fail(
                new Domain.Error.NotionConnectionNotFound({
                    ConnectionId: ConnectionId as Domain.Id.NotionConnectionId
                })
            );
        }

        if (Connection.status === "Revoked")
        {
            return yield* Effect.fail(
                new Domain.Error.NotionConnectionRevoked({
                    ConnectionId: ConnectionId as Domain.Id.NotionConnectionId
                })
            );
        }

        const { data: Credential, error: CredentialError } = yield* Effect.promise(async () =>
            await PrivateSchema
                .from("notion_connection_credentials")
                .select("access_token, refresh_token")
                .eq("connection_id", ConnectionId)
                .maybeSingle());

        if (CredentialError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: CredentialError.message }));
        }

        if (!Credential)
        {
            return yield* Effect.fail(
                new Domain.Error.NotionConnectionRevoked({
                    ConnectionId: ConnectionId as Domain.Id.NotionConnectionId
                })
            );
        }

        const Tokens: ConnectionTokens =
            {
                AccessToken: Credential.access_token as string,
                RefreshToken: (Credential.refresh_token ?? null) as string | null
            };

        return Tokens;
    });
}

/**
 * Runs a Notion Data API call with the connection's access token. On a 401,
 * refreshes the token once (rotating and persisting the whole pair) and
 * retries; a failed refresh surfaces as a 401 {@link Notion.NotionApiError}.
 *
 * NOTE: the refresh is not yet serialized across concurrent requests for the
 * same connection — a follow-up once concurrency is observed.
 *
 * @category NotionAuth
 * @since 1.0.0
 */
export async function CallNotionData<A>(
    Tokens: ConnectionTokens,
    ConnectionId: string,
    Operation: (AccessToken: string) => Promise<A>
): Promise<A>
{
    try
    {
        return await Operation(Tokens.AccessToken);
    }
    catch (Error_)
    {
        const Recoverable = Error_ instanceof Notion.NotionApiError
            && Error_.Status === 401
            && Tokens.RefreshToken !== null;

        if (!Recoverable)
        {
            throw Error_;
        }

        const ClientId = Deno.env.get("NOTION_OAUTH_CLIENT_ID");
        const ClientSecret = Deno.env.get("NOTION_OAUTH_CLIENT_SECRET");

        if (!ClientId || !ClientSecret)
        {
            throw Error_;
        }

        let Fresh: Notion.NotionOAuthTokens;

        try
        {
            Fresh = await Notion.RefreshAuthorization({
                ClientId,
                ClientSecret,
                RefreshToken: Tokens.RefreshToken as string
            });
        }
        catch
        {
            throw new Notion.NotionApiError(401, "refresh_failed");
        }

        await PrivateSchema
            .from("notion_connection_credentials")
            .update({ access_token: Fresh.access_token, refresh_token: Fresh.refresh_token })
            .eq("connection_id", ConnectionId);

        return await Operation(Fresh.access_token);
    }
}

/**
 * Maps a Notion 429 to the domain rate-limit error, carrying `Retry-After`
 * when present.
 *
 * @category NotionAuth
 * @since 1.0.0
 */
export function RateLimited(ApiError: Notion.NotionApiError): Domain.Error.NotionRateLimited
{
    return new Domain.Error.NotionRateLimited(
        ApiError.RetryAfterSeconds !== undefined
            ? { RetryAfterSeconds: ApiError.RetryAfterSeconds }
            : { }
    );
}
