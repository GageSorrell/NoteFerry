/**
 * Server-only page creation (Deno + Effect). Translates a Notivex-shaped
 * `CreatePageCommand` into Notion's Create Page request and records the attempt
 * in `app.operations` for idempotency (ArchitectureInitialDraft.md §20-21):
 * the row is written `pending` before Notion is called, so a retried
 * `OperationId` whose first attempt already succeeded returns the same page
 * instead of creating a duplicate.
 *
 * This is the single Notivex → Notion page mapper (§21, §33): domain
 * `PropertyInput`s become Notion property values here and nowhere else.
 *
 * @module notivex/functions/_shared/Pages
 *
 * @file      Pages.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import * as Notion from "./Notion.ts";
import { CallNotionData, LoadConnectionTokens, RateLimited } from "./NotionAuth.ts";
import { AdminClient } from "./Database.ts";
import { Effect } from "effect";

/** The page-creation input, typed in `@notivex/domain` identity (see the note
 * in `Destinations.ts` about not reusing the inlined `@notivex/api` payload). */
export interface CreatePageInput
{
    readonly DestinationId: Domain.Id.DestinationId;
    readonly OperationId: Domain.Id.OperationId;
    readonly Title?: string | undefined;
    readonly Values: readonly Domain.PageDraft.PropertyInputValue[];
}

/* Translates one Notivex property input into its Notion property value. */
/* eslint-disable-next-line jsdoc/require-jsdoc */
function MapValueToNotion(Value: Domain.Property.PropertyInput): unknown
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
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function MapCreateError(
    Error_: unknown,
    DataSourceId: string
):
    | Domain.Error.DataSourceNotFound
    | Domain.Error.NotionUnauthorized
    | Domain.Error.NotionRateLimited
    | Domain.Error.NotionValidationError
    | Domain.Error.NotionUnavailable
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
}

/** The persisted-configuration slice `Pages` needs: which fields are required. */
interface StoredConfiguration
{
    readonly FieldConfiguration?:
    {
        readonly Fields?: readonly { readonly PropertyId?: string; readonly Required?: boolean }[];
    };
}

/**
 * Creates a Notion page for a destination from a Notivex command, recording the
 * attempt for idempotent retries.
 *
 * @category Pages
 * @since 1.0.0
 */
export function CreateForUser(UserId: string, Command: CreatePageInput)
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
            return yield* Effect.fail(new Domain.Error.InvalidPageDraft({ Message: "Destination not found." }));
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
        const PropertyById = new Map(Properties.map((Property) => [ Property.Id as string, Property ] as const));
        const TitleProperty = Properties.find((Property) => Property.Type === "Title");

        /* 3. Build the Notion properties, validating against the schema. */
        const NotionProperties: Record<string, unknown> = {};
        const Provided = new Set<string>();

        for (const Entry of Command.Values)
        {
            const PropertyId = Entry.PropertyId as string;

            if (!PropertyById.has(PropertyId))
            {
                return yield* Effect.fail(new Domain.Error.InvalidPageDraft({ Message: `Unknown property: ${PropertyId}` }));
            }

            NotionProperties[PropertyId] = MapValueToNotion(Entry.Value);
            Provided.add(PropertyId);
        }

        if (Command.Title !== undefined && TitleProperty)
        {
            NotionProperties[TitleProperty.Id as string] = { title: [ { text: { content: Command.Title } } ] };
            Provided.add(TitleProperty.Id as string);
        }

        const Configuration = Destination.configuration as StoredConfiguration;

        for (const Field of Configuration.FieldConfiguration?.Fields ?? [])
        {
            if (Field.Required && Field.PropertyId && !Provided.has(Field.PropertyId))
            {
                return yield* Effect.fail(new Domain.Error.InvalidPageDraft({ Message: `Missing required property: ${Field.PropertyId}` }));
            }
        }

        /* 4. Idempotency: return the existing page if this OperationId already
         * succeeded; otherwise (re)mark the attempt pending before calling. */
        const { data: Existing, error: ExistingError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("operations")
                .select("state, notion_page_id")
                .eq("id", Command.OperationId)
                .eq("user_id", UserId)
                .maybeSingle());

        if (ExistingError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: ExistingError.message }));
        }

        if (Existing && Existing.state === "succeeded" && Existing.notion_page_id)
        {
            return {
                NotionPageId: Existing.notion_page_id as Domain.Id.NotionPageId,
                OperationId: Command.OperationId
            };
        }

        const { error: OperationError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("operations")
                .upsert(
                    {
                        destination_id: Command.DestinationId,
                        error: null,
                        id: Command.OperationId,
                        notion_page_id: null,
                        payload: Command,
                        state: "pending",
                        user_id: UserId
                    },
                    { onConflict: "id" }
                ));

        if (OperationError)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: OperationError.message }));
        }

        /* 5. Call Notion; on failure, record it on the operation and re-fail. */
        const Tokens = yield* LoadConnectionTokens(UserId, ConnectionId);

        const Page = yield* Effect.tryPromise({
            catch: (Error_) => MapCreateError(Error_, DataSourceId),
            try: () => CallNotionData(Tokens, ConnectionId, (Token) => Notion.CreatePage(Token, {
                parent: { data_source_id: DataSourceId, type: "data_source_id" },
                properties: NotionProperties
            }))
        }).pipe(Effect.tapError((Mapped) =>
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
}
