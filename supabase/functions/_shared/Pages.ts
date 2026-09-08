/**
 * Server-only page creation (Deno + Effect). Translates a NoteFerry-shaped
 * `CreatePageCommand` into Notion's Create Page request and records the attempt
 * in `app.operations` for idempotency: the row is written `pending` before
 * Notion is called, so a retried `OperationId` whose first attempt already
 * succeeded returns the same page instead of creating a duplicate.
 *
 * This is the single NoteFerry → Notion page mapper: domain `PropertyInput`s
 * become Notion property values here and nowhere else.
 *
 * @module noteferry/functions/_shared/Pages
 *
 * @file      Pages.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { ChunkNotionBlocks, MarkdownToNotionBlocks } from "@noteferry/notion-markdown";
import * as Notion from "./Notion.ts";
import { CallNotionData, type ConnectionTokens, LoadConnectionTokens, RateLimited } from "./NotionAuth.ts";
import { AdminClient, PrivateSchema } from "./Database.ts";
import { Effect } from "effect";

/** The page-creation input, typed in `@noteferry/domain` identity (see the note
 * in `Destinations.ts` about not reusing the inlined `@noteferry/api` payload). */
export interface CreatePageInput
{
    readonly Body?: string | undefined;
    readonly Cover?: Domain.Command.PageCoverInput | undefined;
    readonly DestinationId: Domain.Id.DestinationId;
    readonly OperationId: Domain.Id.OperationId;
    readonly Icon?: Domain.Command.PageIconInput | undefined;
    readonly Title?: string | undefined;
    readonly Values: readonly Domain.PageDraft.PropertyInputValue[];
}

/* Translates one NoteFerry property input into its Notion property value. */
/* eslint-disable-next-line jsdoc/require-jsdoc */
const MapValueToNotion = (Value: Domain.Property.PropertyInput): unknown =>
{
    switch (Value.Type)
    {
        case "Title":
            return { title: [ { text: { content: Value.Value } } ] };
        case "RichText":
            return { rich_text: [ { text: { content: Value.Value } } ] };
        case "Number":
            return { number: Value.Value };
        case "Checkbox":
            return { checkbox: Value.Value };
        case "Date":
            return {
                date:
                {
                    start: Value.Start.toISOString(),
                    ...(Value.End ? { end: Value.End.toISOString() } : {})
                }
            };
        case "Select":
            return { select: { id: Value.OptionId } };
        case "MultiSelect":
            return { multi_select: Value.OptionIds.map((Id: Domain.Id.NotionOptionId) => ({ id: Id })) };
        case "Status":
            return { status: { id: Value.OptionId } };
        case "Relation":
            return { relation: Value.PageIds.map((Id: Domain.Id.NotionPageId) => ({ id: Id })) };
        case "People":
            return { people: Value.UserIds.map((Id: string) => ({ id: Id })) };
        case "Url":
            return { url: Value.Value };
        case "Email":
            return { email: Value.Value };
        case "PhoneNumber":
            return { phone_number: Value.Value };
        default:
            return {};
    }
};

/** Base64-decodes a client-submitted local file's contents into raw bytes. */
const DecodeBase64 = (Value: string): Uint8Array =>
{
    const Binary = atob(Value);
    const Bytes = new Uint8Array(Binary.length);

    for (let Index = 0; Index < Binary.length; Index += 1)
    {
        Bytes[Index] = Binary.charCodeAt(Index);
    }

    return Bytes;
};

/**
 * Resolves one Files & media value into Notion's `files` property shape. An
 * external link maps directly; a local upload is sent to Notion's File
 * Upload API first (create the object, then send its bytes) and referenced
 * by the resulting `file_upload` id. Errors are left unmapped here — the
 * caller applies one shared {@link MapCreateError} over this and the
 * subsequent Create Page call.
 */
const ResolveFilesValue = (
    Tokens: ConnectionTokens,
    ConnectionId: string,
    Value: Domain.Property.FilesPropertyInput["Value"]
): Effect.Effect<{ readonly files: ReadonlyArray<unknown> }, unknown> =>
{
    if (Value.Type === "External")
    {
        return Effect.succeed({
            files: [ { external: { url: Value.Url }, name: Value.Name, type: "external" } ]
        });
    }

    return Effect.tryPromise({
        catch: (Error_) => Error_,
        try: async () =>
        {
            const Bytes = DecodeBase64(Value.Base64);
            const ContentType = Value.MimeType ?? "application/octet-stream";

            const Upload = await CallNotionData(Tokens, ConnectionId, (Token) =>
                Notion.CreateFileUpload(Token, { ContentType, Filename: Value.Name }));

            await CallNotionData(Tokens, ConnectionId, (Token) =>
                Notion.SendFileUpload(Token, Upload.id, Bytes, Value.Name, ContentType));

            return {
                files: [ { file_upload: { id: Upload.id }, name: Value.Name, type: "file_upload" } ]
            };
        }
    });
};

/* eslint-disable-next-line jsdoc/require-jsdoc */
const MapCreateError = (
    Error_: unknown,
    DataSourceId: string
):
    | Domain.Error.DataSourceNotFound
    | Domain.Error.NotionUnauthorized
    | Domain.Error.NotionRateLimited
    | Domain.Error.NotionValidationError
    | Domain.Error.NotionUnavailable =>
{
    if (Error_ instanceof Notion.NotionApiError)
    {
        if (Error_.Status === 400)
        {
            return new Domain.Error.NotionValidationError({ Message: Error_.Body });
        }

        if (Error_.Status === 401)
        {
            return new Domain.Error.NotionUnauthorized({ Message: Error_.Body });
        }

        if (Error_.Status === 404)
        {
            return new Domain.Error.DataSourceNotFound({ DataSourceId: DataSourceId as Domain.Id.NotionDataSourceId });
        }

        if (Error_.Status === 429)
        {
            return RateLimited(Error_);
        }

        return new Domain.Error.NotionUnavailable({ Message: Error_.Body });
    }

    return new Domain.Error.NotionUnavailable({ Message: String(Error_) });
};

/** The persisted-configuration slice `Pages` needs: which fields are required. */
interface StoredConfiguration
{
    readonly FieldConfiguration?:
    {
        readonly Fields?: readonly { readonly PropertyId?: string; readonly Required?: boolean }[];
    };
}

/**
 * Creates a Notion page for a destination from a NoteFerry command, recording the
 * attempt for idempotent retries.
 *
 * @category Pages
 * @since 1.0.0
 */
export const CreateForUser = (UserId: string, Command: CreatePageInput) =>
{
    return Effect.gen(function* ()
    {
        /* 1. Resolve the destination (and thus its connection + data source). */
        const { data: Destination, error: DestinationError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("destinations")
                .select("connection_id, data_source_id, configuration")
                .eq("id", Command.DestinationId)
                .eq("user_id", UserId)
                .maybeSingle());

        if (DestinationError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: DestinationError.message }));
        }

        if (!Destination)
        {
            return yield* Effect.fail(new Domain.Error.DestinationNotFound({ DestinationId: Command.DestinationId }));
        }

        const ConnectionId = Destination.connection_id as string;
        const DataSourceId = Destination.data_source_id as string;

        /* 2. Load the cached schema (title property + property validation). */
        const { data: DataSource, error: DataSourceError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("data_sources")
                .select("property_schema")
                .eq("connection_id", ConnectionId)
                .eq("notion_data_source_id", DataSourceId)
                .eq("user_id", UserId)
                .maybeSingle());

        if (DataSourceError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: DataSourceError.message }));
        }

        if (!DataSource)
        {
            return yield* Effect.fail(new Domain.Error.DataSourceNotFound({ DataSourceId: DataSourceId as Domain.Id.NotionDataSourceId }));
        }

        const Properties = DataSource.property_schema as readonly Domain.Property.PropertyDefinition[];
        const { data: IsPro } = yield* Effect.promise(async () =>
            await PrivateSchema.rpc("user_has_pro", { p_user_id: UserId }));

        if (IsPro !== true && (Command.Icon || Command.Cover))
        {
            return yield* Effect.fail(new Domain.Error.FeatureGateError({ Feature: "PageArtwork" }));
        }
        const PropertyById = new Map(Properties.map((Property) => [ Property.Id as string, Property ] as const));
        const TitleProperty = Properties.find((Property) => Property.Type === "Title");

        /* 3. Build the Notion properties, validating against the schema. Files &
         * media values that need an actual Notion upload are deferred into
         * `PendingFiles` — resolved only after the idempotency check below, so a
         * retried, already-succeeded operation never re-uploads a file. */
        const NotionProperties: Record<string, unknown> = {};
        const Provided = new Set<string>();
        const PendingFiles: Array<{
            readonly PropertyId: string;
            readonly Value: Domain.Property.FilesPropertyInput["Value"];
        }> = [];

        for (const Entry of Command.Values)
        {
            const PropertyId = Entry.PropertyId as string;

            if (!PropertyById.has(PropertyId))
            {
                return yield* Effect.fail(new Domain.Error.InvalidPageDraft({ Message: `Unknown property: ${PropertyId}` }));
            }

            if (Entry.Value.Type === "Files")
            {
                PendingFiles.push({ PropertyId, Value: Entry.Value.Value });
            }
            else
            {
                NotionProperties[PropertyId] = MapValueToNotion(Entry.Value);
            }

            Provided.add(PropertyId);
        }

        if (Command.Title !== undefined && TitleProperty)
        {
            NotionProperties[TitleProperty.Id as string] = { title: [ { text: { content: Command.Title } } ] };
            Provided.add(TitleProperty.Id as string);
        }

        const Configuration = Destination.configuration as StoredConfiguration;
        const PageChildren = Command.Body === undefined || Command.Body.trim() === ""
            ? undefined
            : yield* Effect.try({
                catch: (Error_) => new Domain.Error.NotionValidationError({ Message: String(Error_) }),
                try: () => MarkdownToNotionBlocks(
                    Command.Body ?? "",
                    { FailOnUnsupported: true }
                ).Blocks
            });

        for (const Field of IsPro === true
            ? Configuration.FieldConfiguration?.Fields ?? []
            : [])
        {
            if (Field.Required && Field.PropertyId && !Provided.has(Field.PropertyId))
            {
                return yield* Effect.fail(new Domain.Error.InvalidPageDraft({ Message: `Missing required property: ${Field.PropertyId}` }));
            }
        }

        /* 4. Reserve the rolling-window slot and operation atomically. The
         * transaction is serialized per user, so concurrent sixth requests
         * cannot both observe an available slot. Idempotent replays return the
         * existing operation without consuming another slot. */
        const { data: ReservationRows, error: OperationError } = yield* Effect.promise(async () =>
            await PrivateSchema.rpc("reserve_page_operation", {
                p_destination_id: Command.DestinationId,
                p_operation_id: Command.OperationId,
                p_payload: Command,
                p_user_id: UserId
            }));

        if (OperationError)
        {
            if (OperationError.message.includes("FEATURE_GATE:database"))
            {
                return yield* Effect.fail(new Domain.Error.FeatureGateError({ Feature: "Database" }));
            }

            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: OperationError.message }));
        }

        const Reservation = (ReservationRows as ReadonlyArray<Record<string, unknown>> | null)?.[0];

        if (Reservation?.operation_state === "limit_exceeded")
        {
            return yield* Effect.fail(new Domain.Error.FreeCreationWindowExceeded({
                NextAvailableAt: new Date(Reservation.next_available_at as string)
            }));
        }

        if (Reservation?.operation_state === "succeeded" && Reservation.notion_page_id)
        {
            return {
                NotionPageId: Reservation.notion_page_id as Domain.Id.NotionPageId,
                OperationId: Command.OperationId
            };
        }

        if (Reservation?.operation_state === "already_pending")
        {
            return yield* Effect.fail(new Domain.Error.PageCreationInProgress({ }));
        }

        /* 5. Resolve any pending file uploads, then call Notion; on failure
         * (either a file upload or the page creation itself), record it on the
         * operation and re-fail. */
        const Tokens = yield* LoadConnectionTokens(UserId, ConnectionId);

        const Page = yield* Effect.gen(function* ()
        {
            for (const Pending of PendingFiles)
            {
                NotionProperties[Pending.PropertyId] =
                    yield* ResolveFilesValue(Tokens, ConnectionId, Pending.Value);
            }

            let NotionCover: unknown;
            if (Command.Cover?.Type === "External")
            {
                NotionCover = { external: { url: Command.Cover.Url }, type: "external" };
            }
            else if (Command.Cover?.Type === "Upload")
            {
                const Upload = yield* Effect.tryPromise({
                    catch: (Error_) => Error_,
                    try: async () =>
                    {
                        const ContentType = Command.Cover?.MimeType ?? "image/jpeg";
                        const Filename = Command.Cover?.Name ?? "cover.jpg";
                        const Created = await CallNotionData(Tokens, ConnectionId, (Token) =>
                            Notion.CreateFileUpload(Token, { ContentType, Filename }));
                        await CallNotionData(Tokens, ConnectionId, (Token) =>
                            Notion.SendFileUpload(
                                Token,
                                Created.id,
                                DecodeBase64(Command.Cover?.Base64 ?? ""),
                                Filename,
                                ContentType
                            ));
                        return { file_upload: { id: Created.id }, type: "file_upload" };
                    }
                });
                NotionCover = Upload;
            }

            const NotionIcon = Command.Icon?.Type === "Emoji"
                ? { emoji: Command.Icon.Emoji, type: "emoji" }
                : Command.Icon?.Type === "External"
                    ? { external: { url: Command.Icon.Url }, type: "external" }
                    : Command.Icon?.Type === "Upload"
                        ? yield* Effect.tryPromise({
                            catch: (Error_) => Error_,
                            try: async () =>
                            {
                                const ContentType = Command.Icon?.MimeType ?? "image/png";
                                const Filename = Command.Icon?.Name ?? "icon.png";
                                const Created = await CallNotionData(Tokens, ConnectionId, (Token) =>
                                    Notion.CreateFileUpload(Token, { ContentType, Filename }));
                                await CallNotionData(Tokens, ConnectionId, (Token) =>
                                    Notion.SendFileUpload(
                                        Token,
                                        Created.id,
                                        DecodeBase64(Command.Icon?.Base64 ?? ""),
                                        Filename,
                                        ContentType
                                    ));
                                return { file_upload: { id: Created.id }, type: "file_upload" };
                            }
                        })
                        : undefined;

            return yield* Effect.tryPromise({
                catch: (Error_) => Error_,
                try: () => CallNotionData(Tokens, ConnectionId, async (Token) =>
                {
                    const ChildChunks = PageChildren === undefined ? [] : ChunkNotionBlocks(PageChildren);
                    const Page = await Notion.CreatePage(Token, {
                        ...(ChildChunks[0] === undefined ? { } : { children: ChildChunks[0] }),
                        ...(NotionCover === undefined ? { } : { cover: NotionCover }),
                        ...(NotionIcon === undefined ? { } : { icon: NotionIcon }),
                        parent: { data_source_id: DataSourceId, type: "data_source_id" },
                        properties: NotionProperties
                    });

                    for (const Chunk of ChildChunks.slice(1))
                    {
                        await Notion.AppendBlockChildren(
                            Token,
                            Page.id,
                            Chunk
                        );
                    }

                    return Page;
                })
            });
        }).pipe(
            Effect.catchAll((Error_) => Effect.fail(MapCreateError(Error_, DataSourceId))),
            Effect.tapError((Mapped) =>
                Effect.promise(async () =>
                    await AdminClient
                        .from("operations")
                        .update({ error: Mapped._tag, state: "failed" })
                        .eq("id", Command.OperationId))));

        /* 6. Record success and return the result. */
        yield* Effect.promise(async () =>
            await AdminClient
                .from("operations")
                .update({ notion_page_id: Page.id, state: "succeeded" })
                .eq("id", Command.OperationId));

        return {
            NotionPageId: Page.id as Domain.Id.NotionPageId,
            OperationId: Command.OperationId
        };
    });
};
