/**
 * Contract tests for rich-content conversion and Notion API limits.
 *
 * @file      conversion.test.mjs
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
    ChunkNotionBlocks,
    MarkdownToNotionBlocks,
    MarkdownToNotionRichText,
    NotionBlocksToMarkdown,
    ParseMarkdownBlocks,
    SerializeMarkdownBlocks,
    UnsupportedElementError
} from "../Distribution/index.js";

test("chunks top-level children at the official API limit", () =>
{
    const Blocks = Array.from({ length: 205 }, (_, Index) => ({
        object: "block",
        paragraph: { rich_text: [ { text: { content: String(Index) }, type: "text" } ] },
        type: "paragraph"
    }));
    assert.deepEqual(ChunkNotionBlocks(Blocks).map((Chunk) => Chunk.length), [ 100, 100, 5 ]);
});

test("converts the milestone block subset to official request shapes", () =>
{
    const Source = [
        "# Heading",
        "",
        "Paragraph with **bold**, *italic*, ~~strike~~, <u>underline</u>, `code`, and [a link](https://example.com).",
        "",
        "- Bullet",
        "   - Nested bullet",
        "1. Numbered",
        "- [x] Done",
        "",
        "> Quote",
        "",
        "```typescript",
        "const answer = 42;",
        "```",
        "",
        "---"
    ].join("\n");
    const Result = MarkdownToNotionBlocks(Source, { FailOnUnsupported: true });

    assert.deepEqual(Result.Blocks.map((Block) => Block.type), [
        "heading_1",
        "paragraph",
        "bulleted_list_item",
        "numbered_list_item",
        "to_do",
        "quote",
        "code",
        "divider"
    ]);
    assert.equal(Result.UnsupportedElements.length, 0);
    assert.equal(Result.Blocks[2].bulleted_list_item.children[0].type, "bulleted_list_item");
    assert.equal(Result.Blocks[4].to_do.checked, true);
    assert.equal(Result.Blocks[6].code.language, "typescript");
});

test("preserves inline annotations and links", () =>
{
    const Items = MarkdownToNotionRichText("**bold *and italic*** [site](https://example.com)");
    assert.equal(Items[0].annotations.bold, true);
    assert.equal(Items[1].annotations.bold, true);
    assert.equal(Items[1].annotations.italic, true);
    assert.equal(Items.at(-1).text.link.url, "https://example.com");
});

test("chunks rich text without breaking surrogate pairs", () =>
{
    const Items = MarkdownToNotionRichText("😀".repeat(2_001));
    assert.equal(Array.from(Items[0].text.content).length, 2_000);
    assert.equal(Array.from(Items[1].text.content).length, 1);
});

test("parses and serializes editor blocks deterministically", () =>
{
    const Source = "## Title\n\n- one\n   - two\n- [ ] task\n\n> quote";
    const Parsed = ParseMarkdownBlocks(Source);
    assert.equal(SerializeMarkdownBlocks(Parsed.Blocks), Source);
});

test("round trips supported request blocks", () =>
{
    const Source = "# Heading\n\nText with **bold** and [link](https://example.com).\n\n- first\n   - child\n- [x] complete";
    const Requests = MarkdownToNotionBlocks(Source, { FailOnUnsupported: true }).Blocks;
    const Markdown = NotionBlocksToMarkdown(Requests, { FailOnUnsupported: true }).Markdown;
    assert.equal(Markdown, Source);
});

test("omits unsupported blocks by default and aggregates descriptors", () =>
{
    const Source = "<callout>one</callout>\n\n<callout>two</callout>\n\nParagraph";
    const Result = MarkdownToNotionBlocks(Source);
    assert.equal(Result.Blocks.length, 1);
    assert.deepEqual(Result.UnsupportedElements, [ {
        BlockType: "callout",
        Count: 2,
        DisplayLabel: "Callout",
        Reason: "NoteFerry"
    } ]);
});

test("strict conversion fails before unsupported content can be lost", () =>
{
    assert.throws(
        () => MarkdownToNotionBlocks("![alt](https://example.com/image.png)", { FailOnUnsupported: true }),
        UnsupportedElementError
    );
});

test("reports Notion-returned blocks that cannot be recreated", () =>
{
    const Result = NotionBlocksToMarkdown([ {
        child_page: { title: "Child" },
        object: "block",
        type: "child_page"
    } ]);
    assert.equal(Result.Markdown, "");
    assert.equal(Result.UnsupportedElements[0].Reason, "NotionApi");
});
