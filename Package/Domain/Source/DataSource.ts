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
       * A data source surfaced by discovery (Notion search) but not yet cached:
       * enough to list and pick one, without the full property schema. The
       * schema itself arrives via `DataSources.Refresh`, which produces a
       * {@link CachedDataSourceSchema}. See `ArchitectureInitialDraft.md` §36.
       *
       * @category DataSource
       * @since 1.0.0
       */
const DiscoveredDataSource = Schema.Struct({
    ConnectionId: Id.NotionConnectionId,
    CoverUrl: Schema.optional(Schema.String),
    DataSourceId: Id.NotionDataSourceId,
    DatabaseId: Id.NotionDatabaseId,
    Icon: Schema.optional(Schema.String),
    IconType: Schema.optional(Schema.Literals([ "Emoji", "Image", "Native" ])),
    Title: Schema.String
});

/** {@inheritDoc DiscoveredDataSource} */
export type DiscoveredDataSource = Schema.Schema.Type<typeof DiscoveredDataSource>;

export/**
       * The versioned, normalized cache of a Notion data source's schema.
       *
       * @category DataSource
       * @since 1.0.0
       */
const CachedDataSourceSchema = Schema.Struct({
    ConnectionId: Id.NotionConnectionId,
    CoverUrl: Schema.optional(Schema.String),
    DataSourceId: Id.NotionDataSourceId,
    DatabaseId: Id.NotionDatabaseId,
    Icon: Schema.optional(Schema.String),
    IconType: Schema.optional(Schema.Literals([ "Emoji", "Image", "Native" ])),
    NotionLastEditedTime: Schema.DateFromString,
    Properties: Schema.Array(PropertyDefinition),
    RefreshedAt: Schema.DateFromString,
    SchemaHash: Schema.String,
    Title: Schema.String,
    Version: CachedDataSourceSchemaVersion
});

/** {@inheritDoc CachedDataSourceSchema} */
export type CachedDataSourceSchema = Schema.Schema.Type<typeof CachedDataSourceSchema>;
