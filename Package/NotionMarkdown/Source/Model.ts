/**
 * Shared conversion models and loss-reporting primitives.
 *
 * @module @noteferry/notion-markdown/Model
 *
 * @file      Model.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type {
    BlockObjectRequest,
    BlockObjectResponse,
    RichTextItemResponse
} from "@notionhq/client";
import type { RichTextItemRequest } from "@notionhq/client/build/src/api-endpoints/common.js";

/** Why a source element cannot be represented by the conversion target. */
export type UnsupportedReason = "NotionApi" | "NoteFerry" | "Unknown";

/** A stable, aggregate description of content omitted during conversion. */
export interface UnsupportedElementDescriptor
{
    readonly BlockType: string;
    readonly Count: number;
    readonly DisplayLabel: string;
    readonly Reason: UnsupportedReason;
}

/** Controls loss handling for either conversion direction. */
export interface ConversionOptions
{
    readonly FailOnUnsupported?: boolean;
}

/** The block shapes accepted by Notion's official create-page API. */
export type NotionBlockRequest = BlockObjectRequest;

/** Rich text accepted by Notion's official create-page API. */
export type NotionRichTextRequest = RichTextItemRequest;

/** A retrieved Notion block with recursively loaded children attached by NoteFerry. */
export type NotionBlockWithChildren = BlockObjectResponse & {
    readonly children?: ReadonlyArray<NotionBlockWithChildren>;
};

/** Rich text returned by the official Notion API. */
export type NotionRichTextResponse = RichTextItemResponse;

export type MarkdownBlockType =
    | "Paragraph"
    | "Heading1"
    | "Heading2"
    | "Heading3"
    | "BulletedListItem"
    | "NumberedListItem"
    | "ToDo"
    | "Quote"
    | "Code"
    | "Divider";

/** A small, UI-friendly block representation whose text remains enriched Markdown. */
export interface MarkdownBlock
{
    readonly Checked?: boolean;
    readonly Depth: number;
    readonly Language?: string;
    readonly Markdown: string;
    readonly Type: MarkdownBlockType;
}

export interface ParseMarkdownResult
{
    readonly Blocks: ReadonlyArray<MarkdownBlock>;
    readonly UnsupportedElements: ReadonlyArray<UnsupportedElementDescriptor>;
}

export interface MarkdownToNotionResult
{
    readonly Blocks: ReadonlyArray<NotionBlockRequest>;
    readonly UnsupportedElements: ReadonlyArray<UnsupportedElementDescriptor>;
}

export interface NotionToMarkdownResult
{
    readonly Markdown: string;
    readonly UnsupportedElements: ReadonlyArray<UnsupportedElementDescriptor>;
}

/** Thrown when strict conversion would otherwise omit source content. */
export class UnsupportedElementError extends Error
{
    public readonly UnsupportedElements: ReadonlyArray<UnsupportedElementDescriptor>;

    public constructor(UnsupportedElements: ReadonlyArray<UnsupportedElementDescriptor>)
    {
        super(`Unsupported rich-content elements: ${UnsupportedElements.map(
            (Entry) => `${Entry.DisplayLabel} (${Entry.Count})`).join(", ")}`);
        this.name = "UnsupportedElementError";
        this.UnsupportedElements = UnsupportedElements;
    }
}

interface UnsupportedIdentity
{
    readonly BlockType: string;
    readonly DisplayLabel: string;
    readonly Reason: UnsupportedReason;
}

/** Aggregates repeated omissions into the descriptor shape exposed across NoteFerry. */
export class UnsupportedCollector
{
    readonly #Counts = new Map<string, UnsupportedElementDescriptor>();

    public Add(Identity: UnsupportedIdentity, Count: number = 1): void
    {
        const Key = `${Identity.Reason}:${Identity.BlockType}`;
        const Existing = this.#Counts.get(Key);
        this.#Counts.set(Key, {
            ...Identity,
            Count: (Existing?.Count ?? 0) + Count
        });
    }

    public ToArray(): ReadonlyArray<UnsupportedElementDescriptor>
    {
        return [ ...this.#Counts.values() ].sort((Left, Right) =>
            Left.DisplayLabel.localeCompare(Right.DisplayLabel));
    }
}

export const ThrowIfUnsupported = (
    UnsupportedElements: ReadonlyArray<UnsupportedElementDescriptor>,
    Options: ConversionOptions
): void =>
{
    if (Options.FailOnUnsupported === true && UnsupportedElements.length > 0)
    {
        throw new UnsupportedElementError(UnsupportedElements);
    }
};
