/**
 * `NotionConnection` — the user-visible metadata Notivex keeps about one
 * authorized Notion connection.
 *
 * This is deliberately **only** the non-secret metadata a Supabase user is
 * allowed to read about their own connection. Access and refresh tokens are
 * a server-only concept and never appear here — see
 * `ArchitectureInitialDraft.md` §7, §8 and §35 ("the Expo app should know
 * that a user has a Notion connection, but it should never possess the
 * Notion OAuth access token, refresh token, [or] Notion client secret").
 *
 * A `NotionConnection` answers "which Notion authorization do I use?" — see
 * {@link Destination} for "how has this user configured a quick-entry
 * experience?" and {@link DataSource} for "which Notion table/schema is
 * this?".
 *
 * @module @notivex/domain/NotionConnection
 *
 * @file      NotionConnection.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import { Schema } from "effect";

export/**
       * Whether a connection's Notion authorization is still usable.
       *
       * @category NotionConnection
       * @since 1.0.0
       */
const NotionConnectionStatus = Schema.Literals([ "Active", "Revoked" ]);

/** {@inheritDoc NotionConnectionStatus} */
export type NotionConnectionStatus = Schema.Schema.Type<typeof NotionConnectionStatus>;

export/**
       * User-visible metadata about one authorized Notion connection.
       *
       * @category NotionConnection
       * @since 1.0.0
       */
const NotionConnection = Schema.Struct({
    BotId: Schema.String,
    ConnectedAt: Schema.DateFromString,
    Id: Id.NotionConnectionId,
    LastUsedAt: Schema.optional(Schema.DateFromString),
    NotionOwnerUserId: Schema.optional(Schema.String),
    RevokedAt: Schema.optional(Schema.DateFromString),
    Status: NotionConnectionStatus,
    UserId: Id.UserId,
    WorkspaceIconUrl: Schema.optional(Schema.String),
    WorkspaceId: Id.NotionWorkspaceId,
    WorkspaceName: Schema.String
});

/** {@inheritDoc NotionConnection} */
export type NotionConnection = Schema.Schema.Type<typeof NotionConnection>;
