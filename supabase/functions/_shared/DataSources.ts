/**
 * Server-only data-source discovery, caching and refresh (Deno + Effect). This
 * is the single Notion → Notivex mapper (ArchitectureInitialDraft.md §11): it
 * translates Notion's live property DTOs into the normalized
 * `PropertyDefinition` union and persists a `CachedDataSourceSchema`, so a
 * later Notion API change only touches this file.
 *
 * Each exported operation is an `Effect` whose error channel is a subset of the
 * `@notivex/domain` tagged errors declared on the matching `DataSources`
 * endpoint. Notion access tokens are read from the `private` schema and, on a
 * 401, refreshed once and retried (§31).
 *
 * @module notivex/functions/_shared/DataSources
 *
 * @file      DataSources.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import * as Notion from "./Notion.ts";
import { AdminClient, PrivateSchema } from "./Database.ts";
import { Effect } from "effect";

/* --- Pure mapping ----------------------------------------------------- */

/* eslint-disable-next-line jsdoc/require-jsdoc */
function MapColor(Color: string): Domain.Property.PropertyOptionColor
{
    const Base = Color.replace(/_background$/, "");
    const Table: Record<string, Domain.Property.PropertyOptionColor> =
    {
        blue: "Blue",
        brown: "Brown",
        default: "Default",
        gray: "Gray",
        green: "Green",
        orange: "Orange",
        pink: "Pink",
        purple: "Purple",
        red: "Red",
        yellow: "Yellow"
    };

    return Table[Base] ?? "Default";
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function MapOptions(Options: readonly Notion.NotionOption[] | undefined): Domain.Property.PropertyOption[]
{
    return (Options ?? []).map((Option) => ({
        Color: MapColor(Option.color),
        Id: Option.id as Domain.Id.NotionOptionId,
        Name: Option.name
    }));
}

/**
 * Maps one Notion property to its `PropertyDefinition`, or `null` for property
 * types Notivex does not let a user fill in a quick-add form (formula, rollup,
 * created_time, and other read-only/derived types), which are dropped.
 */
/* eslint-disable-next-line jsdoc/require-jsdoc */
function MapProperty(Property: Notion.NotionProperty): Domain.Property.PropertyDefinition | null
{
    const Base = { Id: Property.id as Domain.Id.NotionPropertyId, Name: Property.name };

    switch (Property.type)
    {
        case "title":
            return { ...Base, Type: "Title" as const };
        case "rich_text":
            return { ...Base, Type: "RichText" as const };
        case "number":
            return { ...Base, Format: Property.number?.format ?? "number", Type: "Number" as const };
        case "checkbox":
            return { ...Base, Type: "Checkbox" as const };
        case "date":
            return { ...Base, Type: "Date" as const };
        case "select":
            return { ...Base, Options: MapOptions(Property.select?.options), Type: "Select" as const };
        case "multi_select":
            return { ...Base, Options: MapOptions(Property.multi_select?.options), Type: "MultiSelect" as const };
        case "status":
            return { ...Base, Options: MapOptions(Property.status?.options), Type: "Status" as const };
        case "relation":
        {
            const RelatedId = Property.relation?.data_source_id ?? Property.relation?.database_id;

            if (!RelatedId)
            {
                return null;
            }

            return { ...Base, RelatedDataSourceId: RelatedId as Domain.Id.NotionDataSourceId, Type: "Relation" as const };
        }
        case "people":
            return { ...Base, Type: "People" as const };
        case "url":
            return { ...Base, Type: "Url" as const };
        case "email":
            return { ...Base, Type: "Email" as const };
        case "phone_number":
            return { ...Base, Type: "PhoneNumber" as const };
        case "files":
            return { ...Base, Type: "Files" as const };
        default:
            return null;
    }
}

/**
 * Normalizes Notion's property map (keyed by display name) into the ordered,
 * Notivex-owned `PropertyDefinition[]`, dropping unsupported property types.
 *
 * @category DataSources
 * @since 1.0.0
 */
export function MapProperties(
    Properties: Readonly<Record<string, Notion.NotionProperty>>
): Domain.Property.PropertyDefinition[]
{
    const Mapped: Domain.Property.PropertyDefinition[] = [];

    for (const Property of Object.values(Properties))
    {
        const Definition = MapProperty(Property);

        if (Definition)
        {
            Mapped.push(Definition);
        }
    }

    return Mapped;
}

/**
 * A stable, order-independent hash of a normalized property schema, used to
 * detect when Notion's schema has changed since the last cache (§26). Not
 * cryptographic — a fast content fingerprint (djb2 over canonical JSON).
 *
 * @category DataSources
 * @since 1.0.0
 */
export function ComputeSchemaHash(Properties: readonly Domain.Property.PropertyDefinition[]): string
{
    const Canonical = [ ...Properties ]
        .sort((Left, Right) => (Left.Id < Right.Id ? -1 : Left.Id > Right.Id ? 1 : 0))
        .map((Property) =>
        {
            const Entry: Record<string, unknown> = { Id: Property.Id, Name: Property.Name, Type: Property.Type };

            if ("Options" in Property)
            {
                Entry.Options = Property.Options.map((Option) => Option.Id).sort();
            }

            if ("Format" in Property)
            {
                Entry.Format = Property.Format;
            }

            if ("RelatedDataSourceId" in Property)
            {
                Entry.RelatedDataSourceId = Property.RelatedDataSourceId;
            }

            return Entry;
        });

    const Serialized = JSON.stringify(Canonical);
    let Hash = 5381;

    for (let Index = 0; Index < Serialized.length; Index += 1)
    {
        Hash = (((Hash << 5) + Hash) ^ Serialized.charCodeAt(Index)) >>> 0;
    }

    return Hash.toString(16).padStart(8, "0");
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function IconToString(Icon: Notion.NotionIcon | undefined): string | undefined
{
    if (!Icon)
    {
        return undefined;
    }

    if (Icon.type === "emoji")
    {
        return Icon.emoji;
    }

    if (Icon.type === "external")
    {
        return Icon.external.url;
    }

    if (Icon.type === "file")
    {
        return Icon.file.url;
    }

    return undefined;
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function TitleToString(Title: readonly Notion.NotionRichTextItem[] | undefined): string
{
    if (!Title || Title.length === 0)
    {
        return "Untitled";
    }

    return Title.map((Item) => Item.plain_text ?? "").join("").trim() || "Untitled";
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function ToDiscovered(
    ConnectionId: string,
    Object_: Notion.NotionDataSourceObject
): Domain.DataSource.DiscoveredDataSource | null
{
    const DatabaseId = Object_.parent?.database_id;

    if (!Object_.id || !DatabaseId)
    {
        return null;
    }

    const Icon = IconToString(Object_.icon);

    return {
        ConnectionId: ConnectionId as Domain.Id.NotionConnectionId,
        DatabaseId: DatabaseId as Domain.Id.NotionDatabaseId,
        DataSourceId: Object_.id as Domain.Id.NotionDataSourceId,
        ...(Icon ? { Icon } : {}),
        Title: TitleToString(Object_.title)
    };
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function RowToCached(Row: Record<string, unknown>): Domain.DataSource.CachedDataSourceSchema
{
    const Icon = Row.icon as string | null;

    return {
        ConnectionId: Row.connection_id as Domain.Id.NotionConnectionId,
        DatabaseId: Row.notion_database_id as Domain.Id.NotionDatabaseId,
        DataSourceId: Row.notion_data_source_id as Domain.Id.NotionDataSourceId,
        ...(Icon ? { Icon } : {}),
        NotionLastEditedTime: new Date(Row.notion_last_edited_time as string),
        Properties: Row.property_schema as readonly Domain.Property.PropertyDefinition[],
        RefreshedAt: new Date(Row.refreshed_at as string),
        SchemaHash: Row.schema_hash as string,
        Title: Row.title as string,
        Version: 1
    };
}

/* --- Notion error mapping --------------------------------------------- */

/* eslint-disable-next-line jsdoc/require-jsdoc */
function RateLimited(Error_: Notion.NotionApiError): Domain.Error.NotionRateLimited
{
    return new Domain.Error.NotionRateLimited(
        Error_.RetryAfterSeconds !== undefined ? { RetryAfterSeconds: Error_.RetryAfterSeconds } : {}
    );
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function MapReadError(
    Error_: unknown
): Domain.Error.NotionUnauthorized | Domain.Error.NotionRateLimited | Domain.Error.NotionUnavailable
{
    if (Error_ instanceof Notion.NotionApiError)
    {
        if (Error_.Status === 401)
        {
            return new Domain.Error.NotionUnauthorized({ Message: Error_.Body });
        }

        if (Error_.Status === 429)
        {
            return RateLimited(Error_);
        }

        return new Domain.Error.NotionUnavailable({ Message: Error_.Body });
    }

    return new Domain.Error.NotionUnavailable({ Message: String(Error_) });
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function MapRetrieveError(
    Error_: unknown,
    DataSourceId: string
):
    | Domain.Error.DataSourceNotFound
    | Domain.Error.NotionUnauthorized
    | Domain.Error.NotionRateLimited
    | Domain.Error.NotionUnavailable
{
    if (Error_ instanceof Notion.NotionApiError && Error_.Status === 404)
    {
        return new Domain.Error.DataSourceNotFound({ DataSourceId: DataSourceId as Domain.Id.NotionDataSourceId });
    }

    return MapReadError(Error_);
}

/* --- Token loading + refresh ------------------------------------------ */

/* eslint-disable-next-line jsdoc/require-jsdoc */
function LoadConnectionTokens(UserId: string, ConnectionId: string)
{
    return Effect.gen(function* ()
    {
        const { data: Connection, error: ConnectionError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("notion_connections")
                .select("id, status")
                .eq("id", ConnectionId)
                .eq("user_id", UserId)
                .maybeSingle());

        if (ConnectionError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: ConnectionError.message }));
        }

        if (!Connection)
        {
            return yield* Effect.fail(new Domain.Error.NotionConnectionNotFound({ ConnectionId: ConnectionId as Domain.Id.NotionConnectionId }));
        }

        if (Connection.status === "Revoked")
        {
            return yield* Effect.fail(new Domain.Error.NotionConnectionRevoked({ ConnectionId: ConnectionId as Domain.Id.NotionConnectionId }));
        }

        const { data: Credential, error: CredentialError } = yield* Effect.promise(async () =>
            await PrivateSchema
                .from("notion_connection_credentials")
                .select("access_token, refresh_token")
                .eq("connection_id", ConnectionId)
                .maybeSingle());

        if (CredentialError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: CredentialError.message }));
        }

        if (!Credential)
        {
            return yield* Effect.fail(new Domain.Error.NotionConnectionRevoked({ ConnectionId: ConnectionId as Domain.Id.NotionConnectionId }));
        }

        return {
            AccessToken: Credential.access_token as string,
            RefreshToken: (Credential.refresh_token ?? null) as string | null
        };
    });
}

/**
 * Runs a Notion Data API call with the connection's access token. On a 401,
 * refreshes the token once (rotating and persisting the whole pair, §31) and
 * retries; a failed refresh surfaces as a 401 {@link Notion.NotionApiError}.
 *
 * NOTE: the refresh is not yet serialized across concurrent requests for the
 * same connection (§31) — a follow-up once concurrency is observed.
 */
/* eslint-disable-next-line jsdoc/require-jsdoc */
async function CallNotionData<T>(
    Tokens: { readonly AccessToken: string; readonly RefreshToken: string | null },
    ConnectionId: string,
    Operation: (AccessToken: string) => Promise<T>
): Promise<T>
{
    try
    {
        return await Operation(Tokens.AccessToken);
    }
    catch (Error_)
    {
        const Recoverable = Error_ instanceof Notion.NotionApiError
            && Error_.Status === 401
            && Tokens.RefreshToken !== null;

        if (!Recoverable)
        {
            throw Error_;
        }

        const ClientId = Deno.env.get("NOTION_OAUTH_CLIENT_ID");
        const ClientSecret = Deno.env.get("NOTION_OAUTH_CLIENT_SECRET");

        if (!ClientId || !ClientSecret)
        {
            throw Error_;
        }

        let Fresh: Notion.NotionOAuthTokens;

        try
        {
            Fresh = await Notion.RefreshAuthorization({
                ClientId,
                ClientSecret,
                RefreshToken: Tokens.RefreshToken as string
            });
        }
        catch
        {
            throw new Notion.NotionApiError(401, "refresh_failed");
        }

        await PrivateSchema
            .from("notion_connection_credentials")
            .update({ access_token: Fresh.access_token, refresh_token: Fresh.refresh_token })
            .eq("connection_id", ConnectionId);

        return await Operation(Fresh.access_token);
    }
}

/* --- Operations ------------------------------------------------------- */

/**
 * Discovers the data sources a connection can currently see in Notion, mapped
 * to lightweight {@link Domain.DataSource.DiscoveredDataSource} summaries.
 *
 * @category DataSources
 * @since 1.0.0
 */
export function SearchForUser(UserId: string, ConnectionId: string)
{
    return Effect.gen(function* ()
    {
        const Tokens = yield* LoadConnectionTokens(UserId, ConnectionId);

        const Raw = yield* Effect.tryPromise({
            catch: MapReadError,
            try: () => CallNotionData(Tokens, ConnectionId, (AccessToken) => Notion.SearchDataSources(AccessToken))
        });

        const Discovered: Domain.DataSource.DiscoveredDataSource[] = [];

        for (const Object_ of Raw)
        {
            const Summary = ToDiscovered(ConnectionId, Object_);

            if (Summary)
            {
                Discovered.push(Summary);
            }
        }

        return Discovered;
    });
}

/**
 * Re-fetches a data source's schema from Notion, normalizes it, and upserts the
 * cache row, returning the fresh {@link Domain.DataSource.CachedDataSourceSchema}.
 *
 * @category DataSources
 * @since 1.0.0
 */
export function RefreshForUser(UserId: string, ConnectionId: string, DataSourceId: string)
{
    return Effect.gen(function* ()
    {
        const Tokens = yield* LoadConnectionTokens(UserId, ConnectionId);

        const Object_ = yield* Effect.tryPromise({
            catch: (Error_) => MapRetrieveError(Error_, DataSourceId),
            try: () => CallNotionData(Tokens, ConnectionId, (AccessToken) => Notion.RetrieveDataSource(AccessToken, DataSourceId))
        });

        const Properties = MapProperties(Object_.properties ?? {});
        const SchemaHash = ComputeSchemaHash(Properties);
        const DatabaseId = Object_.parent?.database_id ?? DataSourceId;
        const Title = TitleToString(Object_.title);
        const Icon = IconToString(Object_.icon);
        const NotionLastEditedTime = Object_.last_edited_time ? new Date(Object_.last_edited_time) : new Date();
        const RefreshedAt = new Date();

        const { error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("data_sources")
                .upsert(
                    {
                        connection_id: ConnectionId,
                        icon: Icon ?? null,
                        notion_data_source_id: DataSourceId,
                        notion_database_id: DatabaseId,
                        notion_last_edited_time: NotionLastEditedTime.toISOString(),
                        property_schema: Properties,
                        refreshed_at: RefreshedAt.toISOString(),
                        schema_hash: SchemaHash,
                        title: Title,
                        user_id: UserId
                    },
                    { onConflict: "connection_id,notion_data_source_id" }
                ));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        return {
            ConnectionId: ConnectionId as Domain.Id.NotionConnectionId,
            DatabaseId: DatabaseId as Domain.Id.NotionDatabaseId,
            DataSourceId: DataSourceId as Domain.Id.NotionDataSourceId,
            ...(Icon ? { Icon } : {}),
            NotionLastEditedTime,
            Properties,
            RefreshedAt,
            SchemaHash,
            Title,
            Version: 1
        } satisfies Domain.DataSource.CachedDataSourceSchema;
    });
}

/**
 * Lists every data source cached for the user's connections.
 *
 * @category DataSources
 * @since 1.0.0
 */
export function ListForUser(UserId: string)
{
    return Effect.gen(function* ()
    {
        const { data, error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("data_sources")
                .select("*")
                .eq("user_id", UserId)
                .order("refreshed_at", { ascending: false }));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        return (data ?? []).map((Row) => RowToCached(Row as Record<string, unknown>));
    });
}

/**
 * Reads a single cached data source by its Notion id.
 *
 * @category DataSources
 * @since 1.0.0
 */
export function GetForUser(UserId: string, DataSourceId: string)
{
    return Effect.gen(function* ()
    {
        const { data, error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("data_sources")
                .select("*")
                .eq("user_id", UserId)
                .eq("notion_data_source_id", DataSourceId)
                .maybeSingle());

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        if (!data)
        {
            return yield* Effect.fail(new Domain.Error.DataSourceNotFound({ DataSourceId: DataSourceId as Domain.Id.NotionDataSourceId }));
        }

        return RowToCached(data as Record<string, unknown>);
    });
}
