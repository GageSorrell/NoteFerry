/**
 * `CachedDataSourceSchema` — the versioned, normalized representation of a
 * Notion data source's schema that NoteFerry caches locally so its quick-add
 * UI can render without a round trip to Notion on every launch.
 *
 * Notion remains the canonical source of truth; this is deliberately
 * a *normalized* NoteFerry schema rather than an opaque dump of Notion's API
 * response, so that a future change to Notion's representation only
 * requires updating one mapper.
 *
 * @module @noteferry/domain/DataSource
 *
 * @file      DataSource.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import { PropertyDefinition } from "./Property/Definition.js";
import { PropertyInputValue } from "./PageDraft.js";
import * as Schema from "effect/Schema";

export/**
       * The current schema version of {@link CachedDataSourceSchema}. Bump this
       * literal — and add an explicit `Schema.transform` from the previous
       * version — whenever the cached shape changes, so that stale local caches
       * decode safely instead of silently misbehaving after an app update.
       *
       * @category DataSource
       * @since 1.0.0
       */
const CachedDataSourceSchemaVersion = Schema.Literal(2);

export/**
       * A data source surfaced by discovery (Notion search) but not yet cached:
       * enough to list and pick one, without the full property schema. The
       * schema itself arrives via `DataSources.Refresh`, which produces a
       * {@link CachedDataSourceSchema}.
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
    Icon: Schema.optional(Schema.String),
    IconType: Schema.optional(Schema.Literals([ "Emoji", "Image", "Native" ])),
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
       * A Notion page template belonging to a data source, as cached by
       * NoteFerry: enough to list it (name, icon), tell whether Notion itself
       * currently marks it default, and pre-populate a create-page form from
       * its own property values. `Properties` deliberately omits the Title
       * property (Notion doesn't carry a template's own title into a page
       * created from it) and any `Files`/`Relation`/`People` value (not
       * safely reproducible from a snapshot — see `DataSources.ts`'s
       * `MapPropertyValue`).
       *
       * @category DataSource
       * @since 1.0.0
       */
const CachedDataSourceTemplate = Schema.Struct({
    Icon: Schema.optional(Schema.String),
    IconType: Schema.optional(Schema.Literals([ "Emoji", "Image", "Native" ])),
    IsNotionDefault: Schema.Boolean,
    Name: Schema.String,
    NotionLastEditedTime: Schema.DateFromString,
    Properties: Schema.Array(PropertyInputValue),
    TemplateId: Id.NotionTemplateId
});

/** {@inheritDoc CachedDataSourceTemplate} */
export type CachedDataSourceTemplate = Schema.Schema.Type<typeof CachedDataSourceTemplate>;

export/**
       * The versioned, normalized cache of a Notion data source's schema.
       *
       * @category DataSource
       * @since 1.0.0
       */
const CachedDataSourceSchema = Schema.Struct({
    Access: Schema.Literals([ "Available", "Locked" ]),
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
    Templates: Schema.Array(CachedDataSourceTemplate),
    Title: Schema.String,
    Version: CachedDataSourceSchemaVersion
});

/** {@inheritDoc CachedDataSourceSchema} */
export type CachedDataSourceSchema = Schema.Schema.Type<typeof CachedDataSourceSchema>;
