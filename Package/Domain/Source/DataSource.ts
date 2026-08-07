/**
 * `CachedDataSourceSchema` — the versioned, normalized representation of a
 * Notion data source's schema that Notivex caches locally so its quick-add
 * UI can render without a round trip to Notion on every launch.
 *
 * Notion remains the canonical source of truth; this is deliberately
 * a *normalized* Notivex schema rather than an opaque dump of Notion's API
 * response, so that a future change to Notion's representation only
 * requires updating one mapper. See `ArchitectureInitialDraft.md` §11-12.
 *
 * @module @notivex/domain/DataSource
 *
 * @file      DataSource.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import { PropertyDefinition } from "./Property/Definition.js";
import { Schema } from "effect";

export/**
       * The current schema version of {@link CachedDataSourceSchema}. Bump this
       * literal — and add an explicit `Schema.transform` from the previous
       * version — whenever the cached shape changes, so that stale local caches
       * decode safely instead of silently misbehaving after an app update.
       *
       * @category DataSource
       * @since 1.0.0
       */
const CachedDataSourceSchemaVersion = Schema.Literal(1);

export/**
       * The versioned, normalized cache of a Notion data source's schema.
       *
       * @category DataSource
       * @since 1.0.0
       */
const CachedDataSourceSchema = Schema.Struct({
    ConnectionId: Id.NotionConnectionId,
    DataSourceId: Id.NotionDataSourceId,
    DatabaseId: Id.NotionDatabaseId,
    Icon: Schema.optional(Schema.String),
    NotionLastEditedTime: Schema.DateFromString,
    Properties: Schema.Array(PropertyDefinition),
    RefreshedAt: Schema.DateFromString,
    SchemaHash: Schema.String,
    Title: Schema.String,
    Version: CachedDataSourceSchemaVersion
});

/** {@inheritDoc CachedDataSourceSchema} */
export type CachedDataSourceSchema = Schema.Schema.Type<typeof CachedDataSourceSchema>;
