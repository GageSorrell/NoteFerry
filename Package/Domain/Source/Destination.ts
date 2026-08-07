/**
 * `Destination` — a first-class Notivex concept: how a user has configured a
 * quick-entry experience for one Notion data source. See
 * `ArchitectureInitialDraft.md` §24-25.
 *
 * A `Destination` answers "how has this Notivex user configured a
 * quick-entry experience for this data source?" — see
 * {@link NotionConnection} for "which Notion authorization do I use?" and
 * {@link DataSource} for "which Notion table/schema is this?".
 *
 * @module @notivex/domain/Destination
 *
 * @file      Destination.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import { PropertyInput } from "./Property/Input.js";
import { Schema } from "effect";

export/**
       * Which Notion page template, if any, a destination applies when creating a
       * page. Notion's Create Page API accepts no template, the data source's
       * default template, or a specific template id — see
       * `ArchitectureInitialDraft.md` §28.
       *
       * @category Destination
       * @since 1.0.0
       */
const DestinationTemplate = Schema.Union([
    Schema.Struct({ Type: Schema.tag("None") }),
    Schema.Struct({ Type: Schema.tag("Default") }),
    Schema.Struct({
        TemplateId: Id.NotionTemplateId,
        Type: Schema.tag("Specific")
    })
]);

/** {@inheritDoc DestinationTemplate} */
export type DestinationTemplate = Schema.Schema.Type<typeof DestinationTemplate>;

export/**
       * A single field's Notivex-specific presentation settings, layered on top of
       * (and never modifying) the underlying Notion property definition — see
       * `ArchitectureInitialDraft.md` §23.
       *
       * @category Destination
       * @since 1.0.0
       */
const FieldSetting = Schema.Struct({
    Default: Schema.optional(PropertyInput),
    PropertyId: Id.NotionPropertyId,
    Required: Schema.Boolean,
    Visible: Schema.Boolean
});

/** {@inheritDoc FieldSetting} */
export type FieldSetting = Schema.Schema.Type<typeof FieldSetting>;

export/**
       * The current schema version of {@link FieldConfiguration}. Bump this
       * literal — and add an explicit `Schema.transform` from the previous
       * version — whenever the stored JSONB shape changes.
       *
       * @category Destination
       * @since 1.0.0
       */
const FieldConfigurationVersion = Schema.Literal(1);

export/**
       * The flexible, schema-versioned UI configuration for a destination's
       * fields, decoded from the destination's JSONB configuration column — see
       * `ArchitectureInitialDraft.md` §25.
       *
       * @category Destination
       * @since 1.0.0
       */
const FieldConfiguration = Schema.Struct({
    FieldOrder: Schema.Array(Id.NotionPropertyId),
    Fields: Schema.Array(FieldSetting),
    Version: FieldConfigurationVersion
});

/** {@inheritDoc FieldConfiguration} */
export type FieldConfiguration = Schema.Schema.Type<typeof FieldConfiguration>;

export/**
       * A user-configured quick-entry experience for one Notion data source.
       *
       * @category Destination
       * @since 1.0.0
       */
const Destination = Schema.Struct({
    ConnectionId: Id.NotionConnectionId,
    CreatedAt: Schema.DateFromString,
    DataSourceId: Id.NotionDataSourceId,
    FieldConfiguration,
    Icon: Schema.optional(Schema.String),
    Id: Id.DestinationId,
    Name: Schema.String,
    Position: Schema.Number,
    Template: DestinationTemplate,
    UpdatedAt: Schema.DateFromString,
    UserId: Id.UserId
});

/** {@inheritDoc Destination} */
export type Destination = Schema.Schema.Type<typeof Destination>;
