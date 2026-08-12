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
       * A regular Notion page visible to the content connection during
       * onboarding. Database rows are deliberately excluded: the page list is
       * meant to explain which page trees were shared, not repeat the entries
       * counted beside each database.
       *
       * @category DataSource
       * @since 1.0.0
       */
const OnboardingPage = Schema.Struct({
    Id: Id.NotionPageId,
    Title: Schema.String
});

/** {@inheritDoc OnboardingPage} */
export type OnboardingPage = Schema.Schema.Type<typeof OnboardingPage>;

export/**
       * A Notion database shown in the onboarding picker, including the
       * connection/data-source identity needed to cache it after confirmation
       * and a page count capped at the first 100 entries.
       *
       * @category DataSource
       * @since 1.0.0
       */
const OnboardingDatabase = Schema.Struct({
    ConnectionId: Id.NotionConnectionId,
    DataSourceId: Id.NotionDataSourceId,
    DatabaseId: Id.NotionDatabaseId,
    HasMoreThan100Pages: Schema.Boolean,
    Icon: Schema.optional(Schema.String),
    IconType: Schema.optional(Schema.Literals([ "Emoji", "Image", "Native" ])),
    PageCount: Schema.Number,
    Title: Schema.String
});

/** {@inheritDoc OnboardingDatabase} */
export type OnboardingDatabase = Schema.Schema.Type<typeof OnboardingDatabase>;

export/**
       * The live Notion resources used to classify the post-authorization
       * onboarding result. Lists are presentation-capped while their total
       * counts preserve the number visible to the connection.
       *
       * @category DataSource
       * @since 1.0.0
       */
const OnboardingDiscovery = Schema.Struct({
    DatabaseCount: Schema.Number,
    Databases: Schema.Array(OnboardingDatabase),
    PageCount: Schema.Number,
    Pages: Schema.Array(OnboardingPage)
});

/** {@inheritDoc OnboardingDiscovery} */
export type OnboardingDiscovery = Schema.Schema.Type<typeof OnboardingDiscovery>;

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
