/**
 * Branded string identifiers for every stable identity concept in Notivex.
 *
 * Every ID in this module is a `string` at runtime but is nominally distinct
 * at the type level, so e.g. a `NotionPageId` can never be passed where a
 * `DestinationId` is expected even though both decode from plain strings.
 *
 * @module @notivex/domain/Id
 *
 * @file      Id.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Schema, pipe } from "effect";

export/**
       * Identifies a Notivex user (mirrors the Supabase Auth user id).
       *
       * @category Id
       * @since 1.0.0
       */
const UserId = pipe(
    Schema.String,
    Schema.brand("UserId")
);

/** {@inheritDoc UserId} */
export type UserId = Schema.Schema.Type<typeof UserId>;

export/**
       * Identifies a single authorized Notion connection (one Supabase user may
       * have several).
       *
       * @category Id
       * @since 1.0.0
       */
const NotionConnectionId = pipe(
    Schema.String,
    Schema.brand("NotionConnectionId")
);

/** {@inheritDoc NotionConnectionId} */
export type NotionConnectionId = Schema.Schema.Type<typeof NotionConnectionId>;

export/**
       * Identifies a Notion workspace, as returned by Notion's OAuth token
       * response.
       *
       * @category Id
       * @since 1.0.0
       */
const NotionWorkspaceId = pipe(
    Schema.String,
    Schema.brand("NotionWorkspaceId")
);

/** {@inheritDoc NotionWorkspaceId} */
export type NotionWorkspaceId = Schema.Schema.Type<typeof NotionWorkspaceId>;

export/**
       * Identifies a legacy Notion database. Retained alongside
       * {@link NotionDataSourceId} because Notion's 2025 API split still returns
       * both identifiers for a table.
       *
       * @category Id
       * @since 1.0.0
       */
const NotionDatabaseId = pipe(
    Schema.String,
    Schema.brand("NotionDatabaseId")
);

/** {@inheritDoc NotionDatabaseId} */
export type NotionDatabaseId = Schema.Schema.Type<typeof NotionDatabaseId>;

export/**
       * Identifies a Notion data source — the current API's unit of schema and
       * page containment, one level below a database.
       *
       * @category Id
       * @since 1.0.0
       */
const NotionDataSourceId = pipe(
    Schema.String,
    Schema.brand("NotionDataSourceId")
);

/** {@inheritDoc NotionDataSourceId} */
export type NotionDataSourceId = Schema.Schema.Type<typeof NotionDataSourceId>;

export/**
       * Identifies a Notion page.
       *
       * @category Id
       * @since 1.0.0
       */
const NotionPageId = pipe(
    Schema.String,
    Schema.brand("NotionPageId")
);

/** {@inheritDoc NotionPageId} */
export type NotionPageId = Schema.Schema.Type<typeof NotionPageId>;

export/**
       * Identifies a single property on a Notion data source. Notion property IDs
       * are stable even when a property is renamed, so Notivex stores this rather
       * than the property's display name.
       *
       * @category Id
       * @since 1.0.0
       */
const NotionPropertyId = pipe(
    Schema.String,
    Schema.brand("NotionPropertyId")
);

/** {@inheritDoc NotionPropertyId} */
export type NotionPropertyId = Schema.Schema.Type<typeof NotionPropertyId>;

export/**
       * Identifies a single option of a Notion select, multi-select or status
       * property.
       *
       * @category Id
       * @since 1.0.0
       */
const NotionOptionId = pipe(
    Schema.String,
    Schema.brand("NotionOptionId")
);

/** {@inheritDoc NotionOptionId} */
export type NotionOptionId = Schema.Schema.Type<typeof NotionOptionId>;

export/**
       * Identifies a Notion page template, as selectable when creating a page.
       *
       * @category Id
       * @since 1.0.0
       */
const NotionTemplateId = pipe(
    Schema.String,
    Schema.brand("NotionTemplateId")
);

/** {@inheritDoc NotionTemplateId} */
export type NotionTemplateId = Schema.Schema.Type<typeof NotionTemplateId>;

export/**
       * Identifies a Notivex destination — a user-configured quick-entry
       * experience for one Notion data source.
       *
       * @category Id
       * @since 1.0.0
       */
const DestinationId = pipe(
    Schema.String,
    Schema.brand("DestinationId")
);

/** {@inheritDoc DestinationId} */
export type DestinationId = Schema.Schema.Type<typeof DestinationId>;

export/**
       * Identifies a single page-creation attempt, generated client-side before
       * the request is sent so it can be tracked (and, later, safely retried)
       * across a crash or offline period.
       *
       * @category Id
       * @since 1.0.0
       */
const OperationId = pipe(
    Schema.String,
    Schema.brand("OperationId")
);

/** {@inheritDoc OperationId} */
export type OperationId = Schema.Schema.Type<typeof OperationId>;
