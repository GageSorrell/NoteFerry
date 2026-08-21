/**
 * Server-only destination CRUD (Deno + Effect). A destination is how a user
 * configured a quick-entry experience for one cached data source.
 *
 * Persistence follows a hybrid: queryable columns (name, position, …)
 * plus one schema-versioned `configuration` JSONB blob holding the
 * `FieldConfiguration` and `DestinationTemplate`. That blob is *encoded and
 * decoded through Effect Schema* — a field default can be a
 * `DatePropertyInput`, whose wire form (ISO string) differs from its domain
 * form (`Date`), so a raw cast would corrupt it.
 *
 * @module notivex/functions/_shared/Destinations
 *
 * @file      Destinations.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { Effect, Schema } from "effect";
import { AdminClient, PrivateSchema } from "./Database.ts";

/* The schema-versioned blob stored in `destinations.configuration`: the     *
 * `FieldConfiguration` and `DestinationTemplate`, encoded/decoded through   *
 * Effect Schema so a field default's `DatePropertyInput` (wire: ISO string; *
 * domain: `Date`) round-trips correctly.                                    */
const ConfigurationSchema = Schema.Struct({
    FieldConfiguration: Domain.Destination.FieldConfiguration,
    PostCreationBehavior: Schema.optional(Domain.Behavior.PostCreationBehavior),
    Template: Domain.Destination.DestinationTemplate
});

const EncodeConfiguration = Schema.encodeSync(ConfigurationSchema);
const DecodeConfiguration = Schema.decodeSync(ConfigurationSchema);

/* The `configuration` column arrives typed as `unknown`; assert its stored
 * (encoded) shape so `DecodeConfiguration` — which validates it at runtime —
 * accepts it. */
type ConfigurationEncoded = (typeof ConfigurationSchema)["Encoded"];

/**
 * The create/update inputs, typed in `@notivex/domain` identity so the
 * configuration codec below stays on one type identity. The `api` function's
 * decoded HttpApi payloads are structurally the same and are passed straight
 * in (their `.d.ts` inlines the domain schemas, which is why we don't reuse the
 * `@notivex/api` payload *types* here).
 */
export interface DestinationCreateInput
{
    readonly ConnectionId: Domain.Id.NotionConnectionId;
    readonly DataSourceId: Domain.Id.NotionDataSourceId;
    readonly FieldConfiguration: Domain.Destination.FieldConfiguration;
    readonly Icon?: string | undefined;
    readonly Name: string;
    readonly Position: number;
    readonly PostCreationBehavior?: Domain.Behavior.PostCreationBehavior | undefined;
    readonly Template: Domain.Destination.DestinationTemplate;
}

/** {@inheritDoc DestinationCreateInput} */
export interface DestinationUpdateInput
{
    readonly FieldConfiguration?: Domain.Destination.FieldConfiguration | undefined;
    readonly Icon?: string | undefined;
    readonly Name?: string | undefined;
    readonly Position?: number | undefined;
    readonly PostCreationBehavior?: Domain.Behavior.PostCreationBehavior | undefined;
    readonly Template?: Domain.Destination.DestinationTemplate | undefined;
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function RowToDestination(Row: Record<string, unknown>): Domain.Destination.Destination
{
    const Config = DecodeConfiguration(Row.configuration as ConfigurationEncoded);
    const Icon = Row.icon as string | null;

    return {
        ConnectionId: Row.connection_id as Domain.Id.NotionConnectionId,
        CreatedAt: new Date(Row.created_at as string),
        DataSourceId: Row.data_source_id as Domain.Id.NotionDataSourceId,
        FieldConfiguration: Config.FieldConfiguration,
        ...(Icon ? { Icon } : {}),
        Id: Row.id as Domain.Id.DestinationId,
        Name: Row.name as string,
        Position: Row.position as number,
        ...(Config.PostCreationBehavior ? { PostCreationBehavior: Config.PostCreationBehavior } : { }),
        Template: Config.Template,
        UpdatedAt: new Date(Row.updated_at as string),
        UserId: Row.user_id as Domain.Id.UserId
    };
}

function AutomaticFieldConfiguration(
    Properties: ReadonlyArray<Domain.Property.PropertyDefinition>
): Domain.Destination.FieldConfiguration
{
    return Domain.Destination.ReconcileFieldConfiguration(
        { FieldOrder: [ ], Fields: [ ], Version: 1 },
        Properties
    );
}

function FreeProjection(
    Destination: Domain.Destination.Destination,
    Source: { readonly property_schema: unknown; readonly title: string }
): Domain.Destination.Destination
{
    const { Icon: _StoredIcon, ...Base } = Destination;

    return {
        ...Base,
        FieldConfiguration: AutomaticFieldConfiguration(
            Source.property_schema as ReadonlyArray<Domain.Property.PropertyDefinition>
        ),
        Name: Source.title,
        PostCreationBehavior: { Type: "Home" },
        Template: { Type: "None" }
    };
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
const DecodeFailed = (DecodeError: unknown): Domain.Error.DatabaseError =>
    new Domain.Error.DatabaseError({
        Message: `Destination configuration codec failed: ${String(DecodeError)}`
    });

/**
 * Applies a refreshed Notion property schema to every destination that uses
 * the data source, preserving user settings by stable property ID.
 */
export function ReconcileForDataSource(
    UserId: string,
    ConnectionId: string,
    DataSourceId: string,
    Properties: ReadonlyArray<Domain.Property.PropertyDefinition>
)
{
    return Effect.gen(function* ()
    {
        const { data, error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("destinations")
                .select("id, configuration")
                .eq("user_id", UserId)
                .eq("connection_id", ConnectionId)
                .eq("data_source_id", DataSourceId));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        for (const Row of data ?? [])
        {
            const Current = yield* Effect.try({
                catch: DecodeFailed,
                try: () => DecodeConfiguration(Row.configuration as ConfigurationEncoded)
            });
            const FieldConfiguration = Domain.Destination.ReconcileFieldConfiguration(
                Current.FieldConfiguration,
                Properties
            );
            const Configuration = yield* Effect.try({
                catch: DecodeFailed,
                try: () => EncodeConfiguration({
                    FieldConfiguration,
                    Template: Current.Template
                })
            });

            if (JSON.stringify(Configuration) === JSON.stringify(Row.configuration))
            {
                continue;
            }

            const { error: UpdateError } = yield* Effect.promise(async () =>
                await AdminClient
                    .from("destinations")
                    .update({ configuration: Configuration })
                    .eq("id", Row.id)
                    .eq("user_id", UserId));

            if (UpdateError)
            {
                return yield* Effect.fail(new Domain.Error.DatabaseError({
                    Message: UpdateError.message
                }));
            }
        }
    });
}

/**
 * Every destination the user has configured, ordered for display.
 *
 * @category Destinations
 * @since 1.0.0
 */
export function ListForUser(UserId: string)
{
    return Effect.gen(function* ()
    {
        const [ DestinationResult, DataSourceResult, ProResult ] = yield* Effect.promise(
            async () => Promise.all([
                AdminClient
                    .from("destinations")
                    .select("*")
                    .eq("user_id", UserId)
                    .order("position", { ascending: true }),
                AdminClient
                    .from("data_sources")
                    .select("notion_data_source_id,title,property_schema")
                    .eq("user_id", UserId),
                PrivateSchema.rpc("user_has_pro", { p_user_id: UserId })
            ])
        );
        const { data, error } = DestinationResult;

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        const Destinations = yield* Effect.try({
            catch: DecodeFailed,
            try: () => (data ?? [ ]).map(RowToDestination)
        });

        if (ProResult.data === true)
        {
            return Destinations;
        }

        const SourceById = new Map((DataSourceResult.data ?? [ ]).map((Source) =>
            [ Source.notion_data_source_id, Source ] as const));

        return Destinations.map((Destination) =>
        {
            const Source = SourceById.get(Destination.DataSourceId);

            return Source ? FreeProjection(Destination, Source) : Destination;
        });
    });
}

/**
 * Creates a destination for a cached data source, after verifying the caller
 * owns the connection and has cached the data source.
 *
 * @category Destinations
 * @since 1.0.0
 */
export function CreateForUser(UserId: string, Payload: DestinationCreateInput)
{
    return Effect.gen(function* ()
    {
        const { data: Connection, error: ConnectionError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("notion_connections")
                .select("id")
                .eq("id", Payload.ConnectionId)
                .eq("user_id", UserId)
                .maybeSingle());

        if (ConnectionError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: ConnectionError.message }));
        }

        if (!Connection)
        {
            return yield* Effect.fail(new Domain.Error.NotionConnectionNotFound({
                ConnectionId: Payload.ConnectionId
            }));
        }

        const { data: DataSource, error: DataSourceError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("data_sources")
                .select("notion_data_source_id,title,property_schema,free_active")
                .eq("connection_id", Payload.ConnectionId)
                .eq("notion_data_source_id", Payload.DataSourceId)
                .eq("user_id", UserId)
                .maybeSingle());

        if (DataSourceError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: DataSourceError.message }));
        }

        if (!DataSource)
        {
            return yield* Effect.fail(new Domain.Error.DataSourceNotFound({
                DataSourceId: Payload.DataSourceId
            }));
        }

        const { data: IsPro } = yield* Effect.promise(async () =>
            await PrivateSchema.rpc("user_has_pro", { p_user_id: UserId }));

        if (IsPro !== true && DataSource.free_active !== true)
        {
            return yield* Effect.fail(new Domain.Error.FeatureGateError({ Feature: "Database" }));
        }

        const EffectiveFieldConfiguration = IsPro === true
            ? Payload.FieldConfiguration
            : AutomaticFieldConfiguration(
                DataSource.property_schema as ReadonlyArray<Domain.Property.PropertyDefinition>
            );

        const ConfigurationJson = yield* Effect.try({
            catch: DecodeFailed,
            try: () => EncodeConfiguration({
                FieldConfiguration: EffectiveFieldConfiguration,
                ...(IsPro === true && Payload.PostCreationBehavior
                    ? { PostCreationBehavior: Payload.PostCreationBehavior }
                    : {}),
                Template: IsPro === true ? Payload.Template : { Type: "None" }
            })
        });

        const { data, error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("destinations")
                .insert({
                    configuration: ConfigurationJson,
                    connection_id: Payload.ConnectionId,
                    data_source_id: Payload.DataSourceId,
                    icon: IsPro === true ? Payload.Icon ?? null : null,
                    name: IsPro === true ? Payload.Name : DataSource.title,
                    position: Payload.Position,
                    user_id: UserId
                })
                .select("*")
                .single());

        if (error || !data)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({
                Message: error?.message ?? "Insert returned no row."
            }));
        }

        return yield* Effect.try({
            catch: DecodeFailed,
            try: () => RowToDestination(data as Record<string, unknown>)
        });
    });
}

/**
 * Applies a partial update to a destination. `ConnectionId`/`DataSourceId` are
 * fixed at creation; only presentation, field configuration and template
 * change here.
 *
 * @category Destinations
 * @since 1.0.0
 */
export function UpdateForUser(UserId: string, DestinationId: string, Payload: DestinationUpdateInput)
{
    return Effect.gen(function* ()
    {
        const { data: Existing, error: ExistingError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("destinations")
                .select("*")
                .eq("id", DestinationId)
                .eq("user_id", UserId)
                .maybeSingle());

        if (ExistingError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: ExistingError.message }));
        }

        if (!Existing)
        {
            return yield* Effect.fail(new Domain.Error.DestinationNotFound({
                DestinationId: DestinationId as Domain.Id.DestinationId
            }));
        }

        const { data: IsPro } = yield* Effect.promise(async () =>
            await PrivateSchema.rpc("user_has_pro", { p_user_id: UserId }));

        if (IsPro !== true && Object.keys(Payload).length > 0)
        {
            return yield* Effect.fail(new Domain.Error.FeatureGateError({
                Feature: "DatabaseCustomization"
            }));
        }

        const Current = yield* Effect.try({
            catch: DecodeFailed,
            try: () => DecodeConfiguration(Existing.configuration as ConfigurationEncoded)
        });

        const ResolvedPostCreationBehavior = Payload.PostCreationBehavior
            ?? Current.PostCreationBehavior;
        const ConfigurationJson = yield* Effect.try({
            catch: DecodeFailed,
            try: () => EncodeConfiguration({
                FieldConfiguration: Payload.FieldConfiguration ?? Current.FieldConfiguration,
                ...(ResolvedPostCreationBehavior
                    ? { PostCreationBehavior: ResolvedPostCreationBehavior }
                    : {}),
                Template: Payload.Template ?? Current.Template
            })
        });

        const Patch: Record<string, unknown> = { configuration: ConfigurationJson };

        if (Payload.Name !== undefined)
        {
            Patch.name = Payload.Name;
        }

        if (Payload.Icon !== undefined)
        {
            Patch.icon = Payload.Icon;
        }

        if (Payload.Position !== undefined)
        {
            Patch.position = Payload.Position;
        }

        const { data, error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("destinations")
                .update(Patch)
                .eq("id", DestinationId)
                .eq("user_id", UserId)
                .select("*")
                .single());

        if (error || !data)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({
                Message: error?.message ?? "Update returned no row."
            }));
        }

        return yield* Effect.try({
            catch: DecodeFailed,
            try: () => RowToDestination(data as Record<string, unknown>)
        });
    });
}

/**
 * Deletes a destination. Idempotent — deleting an unknown id is not an error.
 *
 * @category Destinations
 * @since 1.0.0
 */
export function DeleteForUser(UserId: string, DestinationId: string)
{
    return Effect.gen(function* ()
    {
        const { error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("destinations")
                .delete()
                .eq("id", DestinationId)
                .eq("user_id", UserId));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }
    });
}
