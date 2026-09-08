/**
 * Loss-aware conversion between Markdown blocks and official Notion API shapes.
 *
 * @module @noteferry/notion-markdown/Notion
 *
 * @file      Notion.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { ApiColor } from "@notionhq/client";
import type { RichTextItemRequest } from "@notionhq/client/build/src/api-endpoints/common.js";
import {
    type ConversionOptions,
    type MarkdownBlock,
    type MarkdownToNotionResult,
    type NotionBlockRequest,
    type NotionToMarkdownResult,
    type ParseMarkdownResult,
    ThrowIfUnsupported,
    UnsupportedCollector
} from "./Model.js";
import { ParseMarkdownBlocks, SerializeMarkdownBlocks } from "./Markdown.js";

const MaxRichTextContentLength = 2_000;
export const MaxNotionBlockChildren = 100;

/** Splits top-level children at Notion's per-request API limit. */
export const ChunkNotionBlocks = (
    Blocks: ReadonlyArray<NotionBlockRequest>
): ReadonlyArray<ReadonlyArray<NotionBlockRequest>> =>
{
    const Chunks: Array<ReadonlyArray<NotionBlockRequest>> = [];
    for (let Index = 0; Index < Blocks.length; Index += MaxNotionBlockChildren)
    {
        Chunks.push(Blocks.slice(Index, Index + MaxNotionBlockChildren));
    }
    return Chunks;
};

interface AnnotationState
{
    readonly bold: boolean;
    readonly code: boolean;
    readonly color: ApiColor;
    readonly italic: boolean;
    readonly strikethrough: boolean;
    readonly underline: boolean;
}

const DefaultAnnotations: AnnotationState = {
    bold: false,
    code: false,
    color: "default",
    italic: false,
    strikethrough: false,
    underline: false
};

const Escaped = (Source: string, Index: number): boolean =>
{
    let Slashes = 0;
    for (let Cursor = Index - 1; Cursor >= 0 && Source[Cursor] === "\\"; Cursor -= 1)
    {
        Slashes += 1;
    }
    return Slashes % 2 === 1;
};

const FindClosing = (Source: string, Marker: string, Start: number): number =>
{
    let Cursor = Start;
    while (Cursor < Source.length)
    {
        const Found = Source.indexOf(Marker, Cursor);
        if (Found < 0)
        {
            return -1;
        }
        if (!Escaped(Source, Found))
        {
            if ((Marker === "**" || Marker === "__") && Source.startsWith(Marker[0] ?? "", Found + 2))
            {
                return Found + 1;
            }
            return Found;
        }
        Cursor = Found + Marker.length;
    }
    return -1;
};

const SplitContent = (Content: string): ReadonlyArray<string> =>
{
    const Characters = Array.from(Content);
    const Chunks: string[] = [];
    for (let Index = 0; Index < Characters.length; Index += MaxRichTextContentLength)
    {
        Chunks.push(Characters.slice(Index, Index + MaxRichTextContentLength).join(""));
    }
    return Chunks;
};

const SameAnnotations = (Left: AnnotationState, Right: AnnotationState): boolean =>
    Left.bold === Right.bold
    && Left.code === Right.code
    && Left.color === Right.color
    && Left.italic === Right.italic
    && Left.strikethrough === Right.strikethrough
    && Left.underline === Right.underline;

interface RichTextDraft
{
    readonly Annotations: AnnotationState;
    readonly Content: string;
    readonly Url?: string;
}

const PushDraft = (
    Drafts: RichTextDraft[],
    Content: string,
    Annotations: AnnotationState,
    Url?: string
): void =>
{
    if (Content === "")
    {
        return;
    }
    const Previous = Drafts.at(-1);
    if (Previous && Previous.Url === Url && SameAnnotations(Previous.Annotations, Annotations))
    {
        Drafts[Drafts.length - 1] = {
            Annotations,
            Content: Previous.Content + Content,
            ...(Url === undefined ? { } : { Url })
        };
        return;
    }
    Drafts.push({ Annotations, Content, ...(Url === undefined ? { } : { Url }) });
};

const ParseInlineRange = (
    Source: string,
    Drafts: RichTextDraft[],
    Annotations: AnnotationState,
    Url?: string
): void =>
{
    let Plain = "";
    const Flush = (): void =>
    {
        PushDraft(Drafts, Plain, Annotations, Url);
        Plain = "";
    };

    for (let Index = 0; Index < Source.length;)
    {
        if (Source[Index] === "\\" && Index + 1 < Source.length)
        {
            Plain += Source[Index + 1];
            Index += 2;
            continue;
        }

        if (Source.startsWith("<u>", Index))
        {
            const End = Source.indexOf("</u>", Index + 3);
            if (End >= 0)
            {
                Flush();
                ParseInlineRange(Source.slice(Index + 3, End), Drafts, {
                    ...Annotations,
                    underline: true
                }, Url);
                Index = End + 4;
                continue;
            }
        }

        if (Source[Index] === "[")
        {
            const LabelEnd = FindClosing(Source, "]", Index + 1);
            if (LabelEnd >= 0 && Source[LabelEnd + 1] === "(")
            {
                const UrlEnd = FindClosing(Source, ")", LabelEnd + 2);
                if (UrlEnd >= 0)
                {
                    Flush();
                    ParseInlineRange(
                        Source.slice(Index + 1, LabelEnd),
                        Drafts,
                        Annotations,
                        Source.slice(LabelEnd + 2, UrlEnd)
                    );
                    Index = UrlEnd + 1;
                    continue;
                }
            }
        }

        if (Source.startsWith("***", Index))
        {
            const End = FindClosing(Source, "***", Index + 3);
            if (End >= 0)
            {
                Flush();
                ParseInlineRange(Source.slice(Index + 3, End), Drafts, {
                    ...Annotations,
                    bold: true,
                    italic: true
                }, Url);
                Index = End + 3;
                continue;
            }
        }

        const Markers: ReadonlyArray<readonly [string, keyof AnnotationState]> = [
            [ "**", "bold" ],
            [ "__", "bold" ],
            [ "~~", "strikethrough" ],
            [ "`", "code" ],
            [ "*", "italic" ],
            [ "_", "italic" ]
        ];
        const Match = Markers.find(([ Marker ]) => Source.startsWith(Marker, Index));
        if (Match)
        {
            const [ Marker, Annotation ] = Match;
            const End = FindClosing(Source, Marker, Index + Marker.length);
            if (End >= 0)
            {
                Flush();
                ParseInlineRange(Source.slice(Index + Marker.length, End), Drafts, {
                    ...Annotations,
                    [Annotation]: true
                }, Url);
                Index = End + Marker.length;
                continue;
            }
        }

        Plain += Source[Index];
        Index += 1;
    }
    Flush();
};

/** Converts enriched inline Markdown to official Notion rich-text objects. */
export const MarkdownToNotionRichText = (Markdown: string): ReadonlyArray<RichTextItemRequest> =>
{
    const Drafts: RichTextDraft[] = [];
    ParseInlineRange(Markdown, Drafts, DefaultAnnotations);
    return Drafts.flatMap((Draft) => SplitContent(Draft.Content).map((Content) => ({
        annotations: Draft.Annotations,
        text: {
            content: Content,
            ...(Draft.Url === undefined ? { } : { link: { url: Draft.Url } })
        },
        type: "text" as const
    })));
};

const EscapeInlineText = (Text: string): string =>
    Text.replace(/([\\`*_[\]~])/gu, "\\$1");

const WrapAnnotations = (Text: string, Annotations: Partial<AnnotationState>): string =>
{
    let Result = EscapeInlineText(Text);
    if (Annotations.code === true)
    {
        Result = `\`${Text.replace(/`/gu, "\\`")}\``;
    }
    if (Annotations.underline === true)
    {
        Result = `<u>${Result}</u>`;
    }
    if (Annotations.strikethrough === true)
    {
        Result = `~~${Result}~~`;
    }
    if (Annotations.italic === true)
    {
        Result = `*${Result}*`;
    }
    if (Annotations.bold === true)
    {
        Result = `**${Result}**`;
    }
    return Result;
};

const RichTextToMarkdown = (
    Items: ReadonlyArray<unknown>,
    Unsupported: UnsupportedCollector
): string => Items.map((Item) =>
{
    if (!Item || typeof Item !== "object")
    {
        Unsupported.Add({ BlockType: "rich_text", DisplayLabel: "Rich text", Reason: "Unknown" });
        return "";
    }
    const Value = Item as Record<string, unknown>;
    const Type = typeof Value.type === "string" ? Value.type : ("text" in Value ? "text" : "unknown");
    if (Type !== "text")
    {
        Unsupported.Add({
            BlockType: `rich_text_${Type}`,
            DisplayLabel: Type === "mention" ? "Mention" : Type === "equation" ? "Inline equation" : "Rich text",
            Reason: "NoteFerry"
        });
        return typeof Value.plain_text === "string" ? EscapeInlineText(Value.plain_text) : "";
    }
    const Text = Value.text as { content?: unknown; link?: { url?: unknown } | null } | undefined;
    const Content = typeof Text?.content === "string"
        ? Text.content
        : typeof Value.plain_text === "string" ? Value.plain_text : "";
    const Annotations = (Value.annotations ?? { }) as Partial<AnnotationState>;
    if (Annotations.color !== undefined && Annotations.color !== "default")
    {
        Unsupported.Add({ BlockType: "text_color", DisplayLabel: "Text color", Reason: "NoteFerry" });
    }
    let Markdown = WrapAnnotations(Content, Annotations);
    const Url = typeof Text?.link?.url === "string" ? Text.link.url : undefined;
    if (Url)
    {
        Markdown = `[${Markdown}](${Url})`;
    }
    return Markdown;
}).join("");

type MutableBlockRequest = NotionBlockRequest & Record<string, unknown>;

interface BlockNode
{
    readonly Block: NotionBlockRequest;
    readonly Children: BlockNode[];
}

const BlockFromMarkdown = (Block: MarkdownBlock): NotionBlockRequest =>
{
    const RichText = MarkdownToNotionRichText(Block.Markdown);
    switch (Block.Type)
    {
        case "Heading1": return { object: "block", type: "heading_1", heading_1: { rich_text: [ ...RichText ] } };
        case "Heading2": return { object: "block", type: "heading_2", heading_2: { rich_text: [ ...RichText ] } };
        case "Heading3": return { object: "block", type: "heading_3", heading_3: { rich_text: [ ...RichText ] } };
        case "BulletedListItem": return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [ ...RichText ] } };
        case "NumberedListItem": return { object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: [ ...RichText ] } };
        case "ToDo": return { object: "block", type: "to_do", to_do: { checked: Block.Checked === true, rich_text: [ ...RichText ] } };
        case "Quote": return { object: "block", type: "quote", quote: { rich_text: [ ...RichText ] } };
        case "Code": return {
            code: {
                language: (Block.Language || "plain text") as never,
                rich_text: [ ...MarkdownToNotionRichText(Block.Markdown.replace(/([\\`*_[\]~])/gu, "\\$1")) ]
            },
            object: "block",
            type: "code"
        };
        case "Divider": return { divider: { }, object: "block", type: "divider" };
        case "Paragraph":
        default: return { object: "block", paragraph: { rich_text: [ ...RichText ] }, type: "paragraph" };
    }
};

const IsListBlock = (Block: MarkdownBlock): boolean =>
    Block.Type === "BulletedListItem" || Block.Type === "NumberedListItem" || Block.Type === "ToDo";

const MaterializeNode = (Node: BlockNode): NotionBlockRequest =>
{
    if (Node.Children.length === 0)
    {
        return Node.Block;
    }
    const Value = Node.Block as MutableBlockRequest;
    const Type = Value.type;
    if (typeof Type !== "string")
    {
        return Node.Block;
    }
    const Payload = Value[Type] as Record<string, unknown>;
    return {
        ...Value,
        [Type]: { ...Payload, children: Node.Children.map(MaterializeNode) }
    } as NotionBlockRequest;
};

const BlocksToNotion = (Parsed: ParseMarkdownResult): ReadonlyArray<NotionBlockRequest> =>
{
    const Roots: BlockNode[] = [];
    const LastListAtDepth: BlockNode[] = [];
    for (const MarkdownBlock of Parsed.Blocks)
    {
        const Node: BlockNode = { Block: BlockFromMarkdown(MarkdownBlock), Children: [] };
        if (!IsListBlock(MarkdownBlock) || MarkdownBlock.Depth === 0)
        {
            Roots.push(Node);
            LastListAtDepth.length = 0;
            if (IsListBlock(MarkdownBlock))
            {
                LastListAtDepth[0] = Node;
            }
            continue;
        }

        const Depth = Math.min(MarkdownBlock.Depth, LastListAtDepth.length);
        const Parent = LastListAtDepth[Math.max(0, Depth - 1)];
        if (!Parent)
        {
            Roots.push(Node);
            LastListAtDepth[0] = Node;
            LastListAtDepth.length = 1;
            continue;
        }
        Parent.Children.push(Node);
        LastListAtDepth[Depth] = Node;
        LastListAtDepth.length = Depth + 1;
    }
    return Roots.map(MaterializeNode);
};

/** Converts enriched Markdown to official create-page block request objects. */
export const MarkdownToNotionBlocks = (
    Markdown: string,
    Options: ConversionOptions = { }
): MarkdownToNotionResult =>
{
    const Parsed = ParseMarkdownBlocks(Markdown, Options);
    return { Blocks: BlocksToNotion(Parsed), UnsupportedElements: Parsed.UnsupportedElements };
};

const BlockTypeLabels: Readonly<Record<string, string>> = {
    audio: "Audio",
    bookmark: "Bookmark",
    breadcrumb: "Breadcrumb",
    callout: "Callout",
    child_database: "Child database",
    child_page: "Child page",
    column: "Column",
    column_list: "Columns",
    embed: "Embed",
    equation: "Equation",
    file: "File",
    image: "Image",
    link_preview: "Link preview",
    link_to_page: "Page link",
    meeting_notes: "Meeting notes",
    pdf: "PDF",
    synced_block: "Synced block",
    table: "Table",
    table_of_contents: "Table of contents",
    table_row: "Table row",
    tab: "Tab",
    template: "Template",
    toggle: "Toggle",
    transcription: "Transcription",
    unsupported: "Unsupported block",
    video: "Video"
};

const NotionApiOnly = new Set([
    "child_database",
    "child_page",
    "link_preview",
    "meeting_notes",
    "transcription",
    "unsupported"
]);

const ReadBlockType = (Block: Record<string, unknown>): string =>
{
    if (typeof Block.type === "string")
    {
        return Block.type;
    }
    return Object.keys(Block).find((Key) => Key !== "object" && Key !== "children") ?? "unknown";
};

const RichTextFromPayload = (Payload: unknown): ReadonlyArray<unknown> =>
{
    if (!Payload || typeof Payload !== "object")
    {
        return [];
    }
    const RichText = (Payload as Record<string, unknown>).rich_text;
    return Array.isArray(RichText) ? RichText : [];
};

const ReadChildren = (Block: Record<string, unknown>, Payload: unknown): ReadonlyArray<unknown> =>
{
    if (Array.isArray(Block.children))
    {
        return Block.children;
    }
    if (Payload && typeof Payload === "object" && Array.isArray((Payload as Record<string, unknown>).children))
    {
        return (Payload as Record<string, unknown>).children as ReadonlyArray<unknown>;
    }
    return [];
};

const AppendNotionBlock = (
    BlockValue: unknown,
    Depth: number,
    Output: MarkdownBlock[],
    Unsupported: UnsupportedCollector
): void =>
{
    if (!BlockValue || typeof BlockValue !== "object")
    {
        Unsupported.Add({ BlockType: "unknown", DisplayLabel: "Unknown block", Reason: "Unknown" });
        return;
    }
    const Block = BlockValue as Record<string, unknown>;
    const Type = ReadBlockType(Block);
    const Payload = Block[Type];
    const Markdown = RichTextToMarkdown(RichTextFromPayload(Payload), Unsupported);
    let Result: MarkdownBlock | undefined;
    switch (Type)
    {
        case "paragraph": Result = { Depth: 0, Markdown, Type: "Paragraph" }; break;
        case "heading_1": Result = { Depth: 0, Markdown, Type: "Heading1" }; break;
        case "heading_2": Result = { Depth: 0, Markdown, Type: "Heading2" }; break;
        case "heading_3": Result = { Depth: 0, Markdown, Type: "Heading3" }; break;
        case "bulleted_list_item": Result = { Depth, Markdown, Type: "BulletedListItem" }; break;
        case "numbered_list_item": Result = { Depth, Markdown, Type: "NumberedListItem" }; break;
        case "to_do": Result = {
            Checked: Boolean((Payload as Record<string, unknown> | undefined)?.checked),
            Depth,
            Markdown,
            Type: "ToDo"
        }; break;
        case "quote": Result = { Depth: 0, Markdown, Type: "Quote" }; break;
        case "code": Result = {
            Depth: 0,
            Language: String((Payload as Record<string, unknown> | undefined)?.language ?? "plain text"),
            Markdown: RichTextFromPayload(Payload).map((Item) =>
            {
                const Value = Item as Record<string, unknown>;
                const Text = Value.text as { content?: string } | undefined;
                return Text?.content ?? (typeof Value.plain_text === "string" ? Value.plain_text : "");
            }).join(""),
            Type: "Code"
        }; break;
        case "divider": Result = { Depth: 0, Markdown: "", Type: "Divider" }; break;
        default:
            Unsupported.Add({
                BlockType: Type,
                DisplayLabel: BlockTypeLabels[Type] ?? Type,
                Reason: Type === "unknown" ? "Unknown" : NotionApiOnly.has(Type) ? "NotionApi" : "NoteFerry"
            });
    }
    if (Result)
    {
        Output.push(Result);
        for (const Child of ReadChildren(Block, Payload))
        {
            AppendNotionBlock(Child, IsListBlock(Result) ? Depth + 1 : 0, Output, Unsupported);
        }
    }
};

/** Converts recursively loaded Notion blocks to enriched Markdown. */
export const NotionBlocksToMarkdown = (
    Blocks: ReadonlyArray<unknown>,
    Options: ConversionOptions = { }
): NotionToMarkdownResult =>
{
    const MarkdownBlocks: MarkdownBlock[] = [];
    const Unsupported = new UnsupportedCollector();
    for (const Block of Blocks)
    {
        AppendNotionBlock(Block, 0, MarkdownBlocks, Unsupported);
    }
    const UnsupportedElements = Unsupported.ToArray();
    ThrowIfUnsupported(UnsupportedElements, Options);
    return { Markdown: SerializeMarkdownBlocks(MarkdownBlocks), UnsupportedElements };
};
