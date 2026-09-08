/**
 * Deterministic enriched Markdown block parsing and serialization.
 *
 * @module @noteferry/notion-markdown/Markdown
 *
 * @file      Markdown.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    type ConversionOptions,
    type MarkdownBlock,
    type MarkdownBlockType,
    type ParseMarkdownResult,
    ThrowIfUnsupported,
    UnsupportedCollector
} from "./Model.js";

const ListIndentWidth = 3;

const UnsupportedTagLabels: Readonly<Record<string, string>> = {
    audio: "Audio",
    bookmark: "Bookmark",
    callout: "Callout",
    columns: "Columns",
    details: "Toggle",
    embed: "Embed",
    file: "File",
    image: "Image",
    pdf: "PDF",
    table: "Table",
    video: "Video"
};

const DepthFromIndent = (Indent: string): number =>
    Math.max(0, Math.floor(Indent.replace(/\t/gu, "   ").length / ListIndentWidth));

const IsDivider = (Line: string): boolean =>
    /^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/u.test(Line);

const MatchBlockStart = (Line: string): boolean =>
    /^\s{0,3}(?:#{1,3}\s+|>|```|~~~|[-*+]\s+|\d+[.)]\s+)/u.test(Line)
    || IsDivider(Line)
    || /^\s*<\/?[A-Za-z][^>]*>/u.test(Line)
    || /^\s*!\[[^\]]*\]\([^)]+\)\s*$/u.test(Line);

const UnsupportedTag = (Line: string): string | undefined =>
    /^\s*<([A-Za-z][\w-]*)\b[^>]*>/u.exec(Line)?.[1]?.toLowerCase();

const ConsumeUnsupportedTag = (
    Lines: ReadonlyArray<string>,
    Start: number,
    Tag: string
): number =>
{
    if (new RegExp(`</${Tag}\\s*>`, "iu").test(Lines[Start] ?? ""))
    {
        return Start + 1;
    }

    for (let Index = Start + 1; Index < Lines.length; Index += 1)
    {
        if (new RegExp(`</${Tag}\\s*>`, "iu").test(Lines[Index] ?? ""))
        {
            return Index + 1;
        }
    }

    return Start + 1;
};

/** Parses the milestone-one Markdown subset into editor-friendly blocks. */
export const ParseMarkdownBlocks = (
    Markdown: string,
    Options: ConversionOptions = { }
): ParseMarkdownResult =>
{
    const Lines = Markdown.replace(/\r\n?/gu, "\n").split("\n");
    const Blocks: MarkdownBlock[] = [];
    const Unsupported = new UnsupportedCollector();
    let Index = 0;

    while (Index < Lines.length)
    {
        const Line = Lines[Index] ?? "";
        if (Line.trim() === "")
        {
            Index += 1;
            continue;
        }

        const Tag = UnsupportedTag(Line);
        if (Tag !== undefined && Tag !== "u")
        {
            Unsupported.Add({
                BlockType: Tag,
                DisplayLabel: UnsupportedTagLabels[Tag] ?? Tag,
                Reason: UnsupportedTagLabels[Tag] === undefined ? "Unknown" : "NoteFerry"
            });
            Index = ConsumeUnsupportedTag(Lines, Index, Tag);
            continue;
        }

        if (/^\s*!\[[^\]]*\]\([^)]+\)\s*$/u.test(Line))
        {
            Unsupported.Add({ BlockType: "image", DisplayLabel: "Image", Reason: "NoteFerry" });
            Index += 1;
            continue;
        }

        if (Index + 1 < Lines.length
            && /\|/u.test(Line)
            && /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/u.test(Lines[Index + 1] ?? ""))
        {
            Unsupported.Add({ BlockType: "table", DisplayLabel: "Table", Reason: "NoteFerry" });
            Index += 2;
            while (Index < Lines.length && /\|/u.test(Lines[Index] ?? ""))
            {
                Index += 1;
            }
            continue;
        }

        const Fence = /^\s{0,3}(```|~~~)\s*([^\s`]*)\s*$/u.exec(Line);
        if (Fence)
        {
            const Marker = Fence[1] ?? "```";
            const Content: string[] = [];
            Index += 1;
            while (Index < Lines.length && !(Lines[Index] ?? "").trimStart().startsWith(Marker))
            {
                Content.push(Lines[Index] ?? "");
                Index += 1;
            }
            if (Index < Lines.length)
            {
                Index += 1;
            }
            Blocks.push({
                Depth: 0,
                Language: Fence[2] || "plain text",
                Markdown: Content.join("\n"),
                Type: "Code"
            });
            continue;
        }

        if (IsDivider(Line))
        {
            Blocks.push({ Depth: 0, Markdown: "", Type: "Divider" });
            Index += 1;
            continue;
        }

        const Heading = /^\s{0,3}(#{1,3})\s+(.*)$/u.exec(Line);
        if (Heading)
        {
            const Type = `Heading${Heading[1]?.length ?? 1}` as MarkdownBlockType;
            Blocks.push({ Depth: 0, Markdown: Heading[2] ?? "", Type });
            Index += 1;
            continue;
        }

        const ToDo = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/u.exec(Line);
        if (ToDo)
        {
            Blocks.push({
                Checked: (ToDo[2] ?? " ").toLowerCase() === "x",
                Depth: DepthFromIndent(ToDo[1] ?? ""),
                Markdown: ToDo[3] ?? "",
                Type: "ToDo"
            });
            Index += 1;
            continue;
        }

        const Bullet = /^(\s*)[-*+]\s+(.*)$/u.exec(Line);
        if (Bullet)
        {
            Blocks.push({
                Depth: DepthFromIndent(Bullet[1] ?? ""),
                Markdown: Bullet[2] ?? "",
                Type: "BulletedListItem"
            });
            Index += 1;
            continue;
        }

        const Numbered = /^(\s*)\d+[.)]\s+(.*)$/u.exec(Line);
        if (Numbered)
        {
            Blocks.push({
                Depth: DepthFromIndent(Numbered[1] ?? ""),
                Markdown: Numbered[2] ?? "",
                Type: "NumberedListItem"
            });
            Index += 1;
            continue;
        }

        const Quote = /^\s{0,3}>\s?(.*)$/u.exec(Line);
        if (Quote)
        {
            const Content = [ Quote[1] ?? "" ];
            Index += 1;
            while (Index < Lines.length)
            {
                const Continuation = /^\s{0,3}>\s?(.*)$/u.exec(Lines[Index] ?? "");
                if (!Continuation)
                {
                    break;
                }
                Content.push(Continuation[1] ?? "");
                Index += 1;
            }
            Blocks.push({ Depth: 0, Markdown: Content.join("\n"), Type: "Quote" });
            continue;
        }

        const Paragraph = [ Line ];
        Index += 1;
        while (Index < Lines.length
            && (Lines[Index] ?? "").trim() !== ""
            && !MatchBlockStart(Lines[Index] ?? ""))
        {
            Paragraph.push(Lines[Index] ?? "");
            Index += 1;
        }
        Blocks.push({ Depth: 0, Markdown: Paragraph.join("\n"), Type: "Paragraph" });
    }

    const UnsupportedElements = Unsupported.ToArray();
    ThrowIfUnsupported(UnsupportedElements, Options);
    return { Blocks, UnsupportedElements };
};

const PrefixFor = (Block: MarkdownBlock, Number: number): string =>
{
    const Indent = " ".repeat(Block.Depth * ListIndentWidth);
    switch (Block.Type)
    {
        case "Heading1": return "# ";
        case "Heading2": return "## ";
        case "Heading3": return "### ";
        case "BulletedListItem": return `${Indent}- `;
        case "NumberedListItem": return `${Indent}${Number}. `;
        case "ToDo": return `${Indent}- [${Block.Checked === true ? "x" : " "}] `;
        case "Quote": return "> ";
        default: return "";
    }
};

/** Serializes editor-friendly blocks into deterministic enriched Markdown. */
export const SerializeMarkdownBlocks = (Blocks: ReadonlyArray<MarkdownBlock>): string =>
{
    const Output: Array<{ readonly IsList: boolean; readonly Text: string }> = [];
    const NumberAtDepth = new Map<number, number>();

    for (const Block of Blocks)
    {
        const IsList = Block.Type === "BulletedListItem"
            || Block.Type === "NumberedListItem"
            || Block.Type === "ToDo";
        if (Block.Type === "Divider")
        {
            Output.push({ IsList: false, Text: "---" });
            continue;
        }
        if (Block.Type === "Code")
        {
            Output.push({
                IsList: false,
                Text: `\`\`\`${Block.Language === "plain text" ? "" : Block.Language ?? ""}\n${Block.Markdown}\n\`\`\``
            });
            continue;
        }

        let Number = 1;
        if (Block.Type === "NumberedListItem")
        {
            Number = (NumberAtDepth.get(Block.Depth) ?? 0) + 1;
            NumberAtDepth.set(Block.Depth, Number);
        }
        else
        {
            NumberAtDepth.delete(Block.Depth);
            if (!IsList)
            {
                NumberAtDepth.clear();
            }
        }

        const Prefix = PrefixFor(Block, Number);
        const Lines = Block.Markdown.split("\n");
        if (Block.Type === "Quote")
        {
            Output.push({ IsList: false, Text: Lines.map((Line) => `> ${Line}`).join("\n") });
        }
        else
        {
            Output.push({ IsList, Text: `${Prefix}${Block.Markdown}` });
        }
    }

    return Output.map((Entry, Index) =>
    {
        if (Index === 0)
        {
            return Entry.Text;
        }
        const Previous = Output[Index - 1];
        return `${Previous?.IsList === true && Entry.IsList ? "\n" : "\n\n"}${Entry.Text}`;
    }).join("").trimEnd();
};
