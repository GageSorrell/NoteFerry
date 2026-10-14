/**
 * Turns a page-creation command's body into Notion block children, and
 * decides how those children are split between the Create Page request and
 * the Append Block Children requests that follow it.
 *
 * Kept free of database and network access — the Notion call is injected —
 * so the format rules, the Pro gate, and the append ordering can be tested
 * without a Notion workspace. `Pages.ts` supplies the real adapter.
 *
 * @module noteferry/functions/_shared/PageBody
 *
 * @file      PageBody.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import type { NotionBlockChild } from "./Notion.ts";
import {
    ChunkNotionBlocks,
    MarkdownToNotionBlocks as LegacyMarkdownToNotionBlocks
} from "@noteferry/notion-markdown";
import {
    AppendNotionBlocks,
    MarkdownToNotionBlocks,
    PlainTextToNotionBlocks,
    PlanPageChildren
} from "@noteferry/react-native-notion-markdown/Core";

/** The longest body, in UTF-16 code units, the clients let a user write. */
export const MaxBodyLength = 200_000;

/** The `Feature` a `FeatureGateError` names when a rich body is refused. */
export const RichBodyFeature = "RichEditor";

/**
 * Appends one request's worth of children to a page or block, resolving to
 * the ids of the blocks it created, in the order given.
 */
export type AppendChildren = (
    ParentId: string,
    Children: ReadonlyArray<NotionBlockChild>
) => Promise<ReadonlyArray<string>>;

/** A body, converted and ready to send. */
export interface PageBodyPlan
{
    /** Children for the Create Page request itself; empty when the page starts blank. */
    readonly Initial: ReadonlyArray<NotionBlockChild>;
    /** Sends everything `Initial` could not carry, in document order. A no-op when there is nothing left. */
    readonly AppendRemaining: (PageId: string, Append: AppendChildren) => Promise<void>;
}

export type PageBodyResult =
    | { readonly _tag: "Planned"; readonly Plan: PageBodyPlan }
    /** A rich body from an account without NoteFerry Pro. */
    | { readonly _tag: "Gated" }
    /** A body longer than the clients allow. */
    | { readonly _tag: "TooLong"; readonly Message: string }
    /** A body the converter could not represent as Notion blocks. */
    | { readonly _tag: "Invalid"; readonly Message: string };

const EmptyPlan: PageBodyPlan = { AppendRemaining: async () => { }, Initial: [] };

/**
 * Converts a command's body according to its format.
 *
 * - `"NotionMarkdown"` is the block editor's output. It is refused without
 *   Pro — whatever the body holds, including nothing — so the gate cannot be
 *   probed or sidestepped with a particular body.
 * - `"PlainText"` is sent as literal paragraphs, for every account.
 * - No format is a client that predates the field: its body is converted
 *   exactly as it was before the field existed.
 */
export const PlanPageBody = (
    Body: string | undefined,
    BodyFormat: Domain.Command.PageBodyFormat | undefined,
    IsPro: boolean
): PageBodyResult =>
{
    if (BodyFormat === "NotionMarkdown" && !IsPro)
    {
        return { _tag: "Gated" };
    }

    if (Body === undefined || Body.trim() === "")
    {
        return { _tag: "Planned", Plan: EmptyPlan };
    }

    if (BodyFormat === undefined)
    {
        try
        {
            const [ First, ...Rest ] = ChunkNotionBlocks(
                LegacyMarkdownToNotionBlocks(Body, { FailOnUnsupported: true }).Blocks
            );

            return {
                _tag: "Planned",
                Plan:
                {
                    AppendRemaining: async (PageId, Append) =>
                    {
                        for (const Chunk of Rest)
                        {
                            await Append(PageId, Chunk);
                        }
                    },
                    Initial: First ?? []
                }
            };
        }
        catch (Error_)
        {
            return { _tag: "Invalid", Message: String(Error_) };
        }
    }

    if (Body.length > MaxBodyLength)
    {
        return { _tag: "TooLong", Message: `The page body is longer than ${ MaxBodyLength } characters.` };
    }

    const Blocks = BodyFormat === "PlainText"
        ? PlainTextToNotionBlocks(Body)
        : MarkdownToNotionBlocks(Body);
    const { Initial, Remaining } = PlanPageChildren(Blocks);

    return {
        _tag: "Planned",
        Plan:
        {
            AppendRemaining: async (PageId, Append) =>
                await AppendNotionBlocks(
                    async (ParentId, Children) => await Append(ParentId, Children),
                    PageId,
                    Remaining
                ),
            Initial
        }
    };
};

/** What {@link WithRateLimitRetry} needs to know about a failure. */
interface MaybeRateLimited
{
    readonly RetryAfterSeconds?: number | undefined;
    readonly Status?: number | undefined;
}

/**
 * Wraps an append so a Notion rate-limit response is waited out and retried
 * instead of abandoning a page whose earlier blocks already exist. A long
 * body is a run of sequential requests, and Notion's limit (an average of
 * three per second) is one such a run can reach.
 */
export const WithRateLimitRetry = (
    Append: AppendChildren,
    Sleep: (Milliseconds: number) => Promise<void> = (Milliseconds) =>
        new Promise((Resolve) => setTimeout(Resolve, Milliseconds)),
    MaxRetries = 3
): AppendChildren =>
{
    return async (ParentId, Children) =>
    {
        for (let Attempt = 0; ; Attempt += 1)
        {
            try
            {
                return await Append(ParentId, Children);
            }
            catch (Error_)
            {
                const Failure = Error_ as MaybeRateLimited;

                if (Failure?.Status !== 429 || Attempt >= MaxRetries)
                {
                    throw Error_;
                }

                const Seconds = Number.isFinite(Failure.RetryAfterSeconds) ? Failure.RetryAfterSeconds as number : 1;
                await Sleep(Math.min(Math.max(Seconds, 0.5), 10) * 1_000);
            }
        }
    };
};
