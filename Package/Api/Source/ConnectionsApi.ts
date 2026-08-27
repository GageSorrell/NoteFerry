/**
 * The `Connections` group: starting Notion's OAuth authorization flow,
 * listing a user's authorized Notion connections, and disconnecting one.
 * The OAuth token exchange itself happens in the separate, unauthenticated
 * `notion-oauth-callback` Edge Function, not here.
 *
 * @module @noteferry/api/ConnectionsApi
 *
 * @file      ConnectionsApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";

export/**
       * The Notion authorization URL the client should open in a browser to begin
       * the OAuth flow.
       *
       * @category Connections
       * @since 1.0.0
       */
const StartAuthorizationResult = Schema.Struct({
    AuthorizationUrl: Schema.String
});

/** {@inheritDoc StartAuthorizationResult} */
export type StartAuthorizationResult = Schema.Schema.Type<typeof StartAuthorizationResult>;

export/**
       * The provider credentials returned with a successful Supabase Notion
       * sign-in. They are accepted only by the authenticated API and moved into
       * server-only credential storage immediately.
       *
       * @category Connections
       * @since 1.0.0
       */
const AdoptAuthorizationPayload = Schema.Struct({
    ProviderToken: Schema.String,
    ProviderRefreshToken: Schema.optional(Schema.String)
});

/** {@inheritDoc AdoptAuthorizationPayload} */
export type AdoptAuthorizationPayload = Schema.Schema.Type<typeof AdoptAuthorizationPayload>;

export/**
       * Every Notion connection NoteFerry has authorized on behalf of the current
       * user.
       *
       * @category Connections
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
        success: Schema.Array(Domain.NotionConnection.NotionConnection)
    }
);

export/**
       * Begin the Notion OAuth flow by creating a one-time authorization state and
       * returning the URL the client should open.
       *
       * @category Connections
       * @since 1.0.0
       */
const StartAuthorization = HttpApiEndpoint.post(
    "StartAuthorization",
    "/Notion/Start",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DatabaseError
        ],
        success: StartAuthorizationResult
    }
);

export/**
       * Persists the Notion authorization already completed by Supabase Auth,
       * avoiding a second visit to Notion's integration page during sign-in.
       *
       * @category Connections
       * @since 1.0.0
       */
const AdoptAuthorization = HttpApiEndpoint.post(
    "AdoptAuthorization",
    "/Notion/Adopt",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.NotionUnauthorized,
            Domain.Error.NotionRateLimited,
            Domain.Error.NotionUnavailable,
            Domain.Error.NetworkError,
            Domain.Error.DatabaseError
        ],
        payload: AdoptAuthorizationPayload
    }
);

export/**
       * Disconnect (revoke) one of the current user's Notion connections.
       *
       * @category Connections
       * @since 1.0.0
       */
const Disconnect = HttpApiEndpoint.delete(
    "Disconnect",
    "/:ConnectionId",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.NotionConnectionNotFound,
            Domain.Error.DatabaseError
        ],
        params:
        {
            ConnectionId: Domain.Id.NotionConnectionId
        }
    }
);

export/**
       * The `Connections` resource group of the NoteFerry API.
       *
       * @category Connections
       * @since 1.0.0
       */
const ConnectionsApi = HttpApiGroup.make("Connections").add(
    List,
    StartAuthorization,
    AdoptAuthorization,
    Disconnect
);
