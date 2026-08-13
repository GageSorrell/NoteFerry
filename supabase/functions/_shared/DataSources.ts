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
import * as Destinations from "./Destinations.ts";
import * as Notion from "./Notion.ts";
import { CallNotionData, LoadConnectionTokens, RateLimited } from "./NotionAuth.ts";
import { AdminClient } from "./Database.ts";
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

/* eslint-disable-next-line jsdoc/require-jsdoc */
function MapStatusGroups(
    Groups: readonly Notion.NotionStatusGroup[] | undefined
): Domain.Property.StatusGroup[]
{
    return (Groups ?? []).map((Group) => ({
        Color: MapColor(Group.color),
        Id: Group.id,
        Name: Group.name,
        OptionIds: Group.option_ids as readonly Domain.Id.NotionOptionId[]
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
            return {
                ...Base,
                Groups: MapStatusGroups(Property.status?.groups),
                Options: MapOptions(Property.status?.options),
                Type: "Status" as const
            };
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
                Entry.Options = Property.Options
                    .map((Option) => ({
                        Color: Option.Color,
                        Id: Option.Id,
                        Name: Option.Name
                    }))
                    .sort((Left, Right) => Left.Id.localeCompare(Right.Id));
            }

            if ("Groups" in Property && Property.Groups !== undefined)
            {
                Entry.Groups = Property.Groups.map((Group) => ({
                    Color: Group.Color,
                    Id: Group.Id,
                    Name: Group.Name,
                    OptionIds: [ ...Group.OptionIds ]
                }));
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

type NormalizedIcon =
{
    readonly Icon: string;
    readonly IconType: "Emoji" | "Image" | "Native";
};

/* eslint-disable-next-line jsdoc/require-jsdoc */
function NormalizeIcon(Icon: Notion.NotionIcon | undefined): NormalizedIcon | undefined
{
    if (!Icon)
    {
        return undefined;
    }

    if (Icon.type === "emoji")
    {
        return { Icon: Icon.emoji, IconType: "Emoji" };
    }

    if (Icon.type === "custom_emoji")
    {
        return { Icon: Icon.custom_emoji.url, IconType: "Image" };
    }

    if (Icon.type === "external")
    {
        return { Icon: Icon.external.url, IconType: "Image" };
    }

    if (Icon.type === "file")
    {
        return { Icon: Icon.file.url, IconType: "Image" };
    }

    return { Icon: Icon.icon.name, IconType: "Native" };
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function FileToUrl(File: Notion.NotionFile | undefined): string | undefined
{
    if (!File)
    {
        return undefined;
    }

    return File.type === "external" ? File.external.url : File.file.url;
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
function PageTitleToString(Page: Notion.NotionPageObject): string
{
    const TitleProperty = Object.values(Page.properties ?? {}).find(
        (Property) => Property.type === "title"
    );

    return TitleToString(TitleProperty?.title);
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

    const Icon = NormalizeIcon(Object_.icon);

    return {
        ConnectionId: ConnectionId as Domain.Id.NotionConnectionId,
        DatabaseId: DatabaseId as Domain.Id.NotionDatabaseId,
        DataSourceId: Object_.id as Domain.Id.NotionDataSourceId,
        ...(Icon ?? {}),
        Title: TitleToString(Object_.title)
    };
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function RowToCached(Row: Record<string, unknown>): Domain.DataSource.CachedDataSourceSchema
{
    const CoverUrl = Row.cover_url as string | null;
    const Icon = Row.icon as string | null;
    const IconType = Row.icon_type as NormalizedIcon["IconType"] | null;

    return {
        ConnectionId: Row.connection_id as Domain.Id.NotionConnectionId,
        ...(CoverUrl ? { CoverUrl } : {}),
        DatabaseId: Row.notion_database_id as Domain.Id.NotionDatabaseId,
        DataSourceId: Row.notion_data_source_id as Domain.Id.NotionDataSourceId,
        ...(Icon ? { Icon } : {}),
        ...(IconType ? { IconType } : {}),
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
 * Discovers the regular pages and first 100 databases visible to a connection,
 * then queries the first 100 rows of every displayed database. Database-entry
 * pages are excluded from the page disclosure because they are already
 * represented by their parent's count.
 *
 * @category DataSources
 * @since 1.0.0
 */
export function DiscoverOnboardingForUser(UserId: string, ConnectionId: string)
{
    return Effect.gen(function* ()
    {
        const Tokens = yield* LoadConnectionTokens(UserId, ConnectionId);
        const Raw = yield* Effect.tryPromise({
            catch: MapReadError,
            try: () => CallNotionData(Tokens, ConnectionId, async (AccessToken) =>
            {
                const [ DataSources, Pages ] = await Promise.all([
                    Notion.SearchDataSources(AccessToken),
                    Notion.SearchPages(AccessToken)
                ]);

                return { DataSources, Pages };
            })
        });

        const Discovered = Raw.DataSources
            .map((Object_) => ToDiscovered(ConnectionId, Object_))
            .filter((Source): Source is Domain.DataSource.DiscoveredDataSource => Source !== null)
            .sort((Left, Right) => Left.Title.localeCompare(Right.Title, undefined, {
                sensitivity: "base"
            }));
        const DisplayedDataSources = Discovered.slice(0, 100);
        const Enriched = yield* Effect.tryPromise({
            catch: MapReadError,
            try: () => CallNotionData(Tokens, ConnectionId, async (AccessToken) =>
            {
                const Result: Array<{
                    readonly Count: Notion.NotionDataSourcePageCount;
                    readonly Database?: Notion.NotionDatabaseObject;
                    readonly DataSource?: Notion.NotionDataSourceObject;
                    readonly ParentPage?: Notion.NotionPageObject;
                }> = [];

                /* Notion averages three requests per second per connection.
                 * Metadata and counts are resolved sequentially so a large
                 * workspace does not turn this request into a burst of 429s. */
                for (const Source of DisplayedDataSources)
                {
                    let Database: Notion.NotionDatabaseObject | undefined;
                    let DataSource: Notion.NotionDataSourceObject | undefined;
                    let ParentPage: Notion.NotionPageObject | undefined;
                    let Count: Notion.NotionDataSourcePageCount = {
                        HasMoreThan100Pages: false,
                        PageCount: 0
                    };

                    try
                    {
                        Database = await Notion.RetrieveDatabase(
                            AccessToken,
                            Source.DatabaseId
                        );
                    }
                    catch (Error_)
                    {
                        if (Error_ instanceof Notion.NotionApiError && Error_.Status === 401)
                        {
                            throw Error_;
                        }
                    }

                    await new Promise((Resolve) => setTimeout(Resolve, 350));

                    /* Search results and the parent database can both omit an
                     * icon that is attached directly to the newer Notion data
                     * source object. Resolve that object only for the missing
                     * icon case so the common path does not add another API
                     * request for every database. */
                    if (!Source.Icon && !Database?.icon)
                    {
                        try
                        {
                            DataSource = await Notion.RetrieveDataSource(
                                AccessToken,
                                Source.DataSourceId
                            );
                        }
                        catch (Error_)
                        {
                            if (Error_ instanceof Notion.NotionApiError
                                && Error_.Status === 401)
                            {
                                throw Error_;
                            }
                        }

                        await new Promise<void>((Resolve: () => void) =>
                            setTimeout(Resolve, 350));
                    }

                    const ParentPageId = Database?.parent?.type === "page_id"
                        ? Database.parent.page_id
                        : undefined;

                    if (!Source.Icon
                        && !Database?.icon
                        && !DataSource?.icon
                        && ParentPageId)
                    {
                        try
                        {
                            ParentPage = await Notion.RetrievePage(
                                AccessToken,
                                ParentPageId
                            );
                        }
                        catch (Error_)
                        {
                            if (Error_ instanceof Notion.NotionApiError
                                && Error_.Status === 401)
                            {
                                throw Error_;
                            }
                        }

                        await new Promise<void>((Resolve: () => void) =>
                            setTimeout(Resolve, 350));
                    }

                    try
                    {
                        Count = await Notion.QueryDataSourcePageCount(
                            AccessToken,
                            Source.DataSourceId
                        );
                    }
                    catch (Error_)
                    {
                        if (Error_ instanceof Notion.NotionApiError && Error_.Status === 401)
                        {
                            throw Error_;
                        }
                    }

                    Result.push({
                        Count,
                        ...(Database ? { Database } : {}),
                        ...(DataSource ? { DataSource } : {}),
                        ...(ParentPage ? { ParentPage } : {})
                    });
                    await new Promise((Resolve) => setTimeout(Resolve, 350));
                }

                return Result;
            })
        });
        const Databases: Domain.DataSource.OnboardingDatabase[] = DisplayedDataSources.map((
            Source,
            Index
        ) => ({
            ...Source,
            ...(NormalizeIcon(
                Enriched[Index]?.Database?.icon
                    ?? Enriched[Index]?.DataSource?.icon
                    ?? Enriched[Index]?.ParentPage?.icon
            ) ?? {}),
            HasMoreThan100Pages: Enriched[Index]?.Count.HasMoreThan100Pages ?? false,
            PageCount: Enriched[Index]?.Count.PageCount ?? 0,
            Title: TitleToString(Enriched[Index]?.Database?.title) === "Untitled"
                ? Source.Title
                : TitleToString(Enriched[Index]?.Database?.title)
        }));
        const Pages = Raw.Pages
            .filter((Page) => Page.parent?.type !== "data_source_id"
                && Page.parent?.type !== "database_id")
            .map((Page): Domain.DataSource.OnboardingPage => ({
                Id: Page.id as Domain.Id.NotionPageId,
                Title: PageTitleToString(Page)
            }))
            .sort((Left, Right) => Left.Title.localeCompare(Right.Title, undefined, {
                sensitivity: "base"
            }));

        return {
            DatabaseCount: Discovered.length,
            Databases,
            PageCount: Pages.length,
            Pages: Pages.slice(0, 25)
        } satisfies Domain.DataSource.OnboardingDiscovery;
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
        const Database = yield* Effect.tryPromise({
            catch: MapReadError,
            try: () => CallNotionData(Tokens, ConnectionId, (AccessToken) => Notion.RetrieveDatabase(AccessToken, DatabaseId))
        });
        const ParentPageId = Database.parent?.type === "page_id" ? Database.parent.page_id : undefined;
        let ParentPage: Notion.NotionPageObject | undefined;

        if ((!Database.cover || !Database.icon) && ParentPageId)
        {
            ParentPage = yield* Effect.promise(async () =>
            {
                try
                {
                    return await CallNotionData(
                        Tokens,
                        ConnectionId,
                        (AccessToken) => Notion.RetrievePage(AccessToken, ParentPageId)
                    );
                }
                catch
                {
                    // Parent-page artwork is an optional fallback; its failure
                    // must not make an otherwise usable data source disappear.
                    return undefined;
                }
            });
        }

        const CoverUrl = FileToUrl(Database.cover ?? ParentPage?.cover);
        const Title = TitleToString(Database.title ?? Object_.title);
        const Icon = NormalizeIcon(Database.icon ?? Object_.icon ?? ParentPage?.icon);
        const NotionLastEditedTime = Object_.last_edited_time ? new Date(Object_.last_edited_time) : new Date();
        const RefreshedAt = new Date();

        const { error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("data_sources")
                .upsert(
                    {
                        connection_id: ConnectionId,
                        cover_url: CoverUrl ?? null,
                        icon: Icon?.Icon ?? null,
                        icon_type: Icon?.IconType ?? null,
                        notion_data_source_id: DataSourceId,
                        notion_database_id: DatabaseId,
                        notion_last_edited_time: NotionLastEditedTime.toISOString(),
                        property_schema: Properties,
                        refreshed_at: RefreshedAt.toISOString(),
                        schema_hash: SchemaHash,
                        selected: true,
                        title: Title,
                        user_id: UserId
                    },
                    { onConflict: "connection_id,notion_data_source_id" }
                ));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        yield* Destinations.ReconcileForDataSource(
            UserId,
            ConnectionId,
            DataSourceId,
            Properties
        );

        return {
            ConnectionId: ConnectionId as Domain.Id.NotionConnectionId,
            ...(CoverUrl ? { CoverUrl } : {}),
            DatabaseId: DatabaseId as Domain.Id.NotionDatabaseId,
            DataSourceId: DataSourceId as Domain.Id.NotionDataSourceId,
            ...(Icon ?? {}),
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
                .eq("selected", true)
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
