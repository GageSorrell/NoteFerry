/**
 * `Destination` — a first-class NoteFerry concept: how a user has configured a
 * quick-entry experience for one Notion data source.
 *
 * A `Destination` answers "how has this NoteFerry user configured a
 * quick-entry experience for this data source?" — see
 * {@link NotionConnection} for "which Notion authorization do I use?" and
 * {@link DataSource} for "which Notion table/schema is this?".
 *
 * @module @noteferry/domain/Destination
 *
 * @file      Destination.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { CachedDataSourceTemplate } from "./DataSource.js";
import * as Behavior from "./Behavior.js";
import * as Id from "./Id.js";
import type { PropertyDefinition } from "./Property/Definition.js";
import { PropertyInput } from "./Property/Input.js";
import { Schema } from "effect";

export/**
       * Which Notion page template, if any, a destination applies when
       * creating a page: none, or one specific template — selected once,
       * either automatically (Notion's own default, snapshotted the moment
       * the destination is created) or explicitly by the user, and never
       * re-derived from Notion's live default afterward. Being a "default
       * template" in NoteFerry is deliberately decoupled from being Notion's
       * default: see `Destinations.ts`'s `CreateForUser` for the one place
       * that snapshot happens.
       *
       * A destination saved before this decoupling may still have the legacy
       * `{Type:"Default"}` value stored in its `configuration` JSONB blob —
       * `Destinations.ts` normalizes that to `{Type:"None"}` before this
       * schema ever sees it, since NoteFerry can no longer tell which Notion
       * template a stored "Default" pointed to.
       *
       * @category Destination
       * @since 1.0.0
       */
const DestinationTemplate = Schema.Union([
    Schema.Struct({ Type: Schema.tag("None") }),
    Schema.Struct({
        TemplateId: Id.NotionTemplateId,
        Type: Schema.tag("Specific")
    })
]);

/** {@inheritDoc DestinationTemplate} */
export type DestinationTemplate = Schema.Schema.Type<typeof DestinationTemplate>;

export/**
       * A single field's NoteFerry-specific presentation settings, layered on top of
       * (and never modifying) the underlying Notion property definition.
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
       * fields, decoded from the destination's JSONB configuration column.
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

/** Whether a property can be edited by the current quick-entry form. */
export const IsQuickEntryProperty = (Property: PropertyDefinition): boolean =>
{
    return ![ "People", "Relation" ].includes(Property.Type);
};

/**
 * Reconciles saved field preferences with a freshly fetched Notion schema.
 * Existing settings follow stable property IDs, deleted properties disappear,
 * and new writable properties are appended and shown by default.
 */
export const ReconcileFieldConfiguration = (
    Current: FieldConfiguration,
    Properties: ReadonlyArray<PropertyDefinition>
): FieldConfiguration =>
{
    const PropertyById = new Map(Properties.map((Property: PropertyDefinition) =>
        [ Property.Id, Property ] as const));
    const SettingById = new Map(Current.Fields.map((Field: FieldSetting) =>
        [ Field.PropertyId, Field ] as const));
    const SeenIds = new Set<Id.NotionPropertyId>();
    const FieldOrder: Array<Id.NotionPropertyId> = [];

    for (const PropertyId of Current.FieldOrder)
    {
        if (PropertyById.has(PropertyId) && !SeenIds.has(PropertyId))
        {
            SeenIds.add(PropertyId);
            FieldOrder.push(PropertyId);
        }
    }

    for (const Property of Properties)
    {
        if (!SeenIds.has(Property.Id))
        {
            SeenIds.add(Property.Id);
            FieldOrder.push(Property.Id);
        }
    }

    const Fields = FieldOrder.map((PropertyId: Id.NotionPropertyId): FieldSetting =>
    {
        const Property = PropertyById.get(PropertyId)!;
        const Existing = SettingById.get(PropertyId);

        if (Existing === undefined)
        {
            return {
                PropertyId,
                Required: Property.Type === "Title",
                Visible: IsQuickEntryProperty(Property)
            };
        }

        const CompatibleDefault = Existing.Default !== undefined
            && Existing.Default.Type === Property.Type
            ? Existing.Default
            : undefined;

        return {
            ...(CompatibleDefault === undefined ? { } : { Default: CompatibleDefault }),
            PropertyId,
            Required: Property.Type === "Title" || Existing.Required,
            Visible: Existing.Visible
        };
    });

    return { FieldOrder, Fields, Version: 1 };
};

export/**
       * The current schema version of {@link TemplateConfiguration}. Bump this
       * literal — and add an explicit normalization step for the previous
       * version — whenever the stored JSONB shape changes.
       *
       * @category Destination
       * @since 1.0.0
       */
const TemplateConfigurationVersion = Schema.Literal(1);

export/**
       * A destination's NoteFerry-only template preferences, layered on top of
       * (and never modifying) the data source's Notion-sourced template list:
       * which templates are hidden from the main list, and the display/drag
       * order of every known template (hidden ones included, so a template
       * reappears where it was when un-hidden).
       *
       * @category Destination
       * @since 1.0.0
       */
const TemplateConfiguration = Schema.Struct({
    Hidden: Schema.Array(Id.NotionTemplateId),
    TemplateOrder: Schema.Array(Id.NotionTemplateId),
    Version: TemplateConfigurationVersion
});

/** {@inheritDoc TemplateConfiguration} */
export type TemplateConfiguration = Schema.Schema.Type<typeof TemplateConfiguration>;

const EmptyTemplateConfiguration: TemplateConfiguration = { Hidden: [ ], TemplateOrder: [ ], Version: 1 };

/**
 * Reconciles saved template order/visibility with a freshly fetched Notion
 * template list. Existing settings follow stable template IDs, templates
 * Notion no longer returns disappear, and newly seen templates are appended
 * to the order, visible by default.
 */
export const ReconcileTemplateConfiguration = (
    Current: TemplateConfiguration,
    Templates: ReadonlyArray<CachedDataSourceTemplate>
): TemplateConfiguration =>
{
    const KnownIds = new Set(Templates.map((Template: CachedDataSourceTemplate) => Template.TemplateId));
    const SeenIds = new Set<Id.NotionTemplateId>();
    const TemplateOrder: Array<Id.NotionTemplateId> = [];

    for (const TemplateId of Current.TemplateOrder)
    {
        if (KnownIds.has(TemplateId) && !SeenIds.has(TemplateId))
        {
            SeenIds.add(TemplateId);
            TemplateOrder.push(TemplateId);
        }
    }

    for (const Template of Templates)
    {
        if (!SeenIds.has(Template.TemplateId))
        {
            SeenIds.add(Template.TemplateId);
            TemplateOrder.push(Template.TemplateId);
        }
    }

    const Hidden = Current.Hidden.filter((TemplateId: Id.NotionTemplateId) => KnownIds.has(TemplateId));

    return { Hidden, TemplateOrder, Version: 1 };
};

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
    PostCreationBehavior: Schema.optional(Behavior.PostCreationBehavior),
    Template: DestinationTemplate,
    TemplateConfiguration: Schema.optional(TemplateConfiguration),
    UpdatedAt: Schema.DateFromString,
    UserId: Id.UserId
});

/** {@inheritDoc Destination} */
export type Destination = Schema.Schema.Type<typeof Destination>;

/**
 * A destination's post-creation behavior, defaulting to `Home` for
 * destinations saved before this field existed.
 *
 * @category Destination
 * @since 2.0.0
 */
export const ResolvePostCreationBehavior = (
    Destination: Destination
): Behavior.PostCreationBehavior =>
{
    return Destination.PostCreationBehavior ?? { Type: "Home" };
};

/**
 * A destination's template order/visibility preferences, defaulting to empty
 * (nothing hidden, no explicit order) for destinations saved before this
 * field existed.
 *
 * @category Destination
 * @since 2.0.0
 */
export const ResolveTemplateConfiguration = (
    Destination: Destination
): TemplateConfiguration =>
{
    return Destination.TemplateConfiguration ?? EmptyTemplateConfiguration;
};

/**
 * The data source template a destination currently selects as its NoteFerry
 * default, or `undefined` for `{Type:"None"}` or a `Specific` selection that
 * no longer resolves against the given (freshly reconciled) template list.
 *
 * @category Destination
 * @since 2.0.0
 */
export const ResolveSelectedTemplate = (
    Destination: Destination,
    Templates: ReadonlyArray<CachedDataSourceTemplate>
): CachedDataSourceTemplate | undefined =>
{
    const Selection = Destination.Template;

    if (Selection.Type !== "Specific")
    {
        return undefined;
    }

    return Templates.find((Template: CachedDataSourceTemplate) =>
        Template.TemplateId === Selection.TemplateId);
};
