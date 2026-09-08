/**
 * Unit tests for pure rich editor block operations.
 *
 * @file      rich-editor-state.test.mjs
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
    DeleteRichEditorBlock,
    IndentRichEditorBlock,
    InsertRichEditorBlock,
    MoveRichEditorBlock,
    RichEditorDocumentFromMarkdown,
    RichEditorDocumentToMarkdown,
    UpdateRichEditorBlock
} from "../Distribution/rich-editor/State.js";

const IdFactory = () =>
{
    let Counter = 0;
    return () => `id-${Counter += 1}`;
};

test("materializes controlled Markdown into stable editor blocks", () =>
{
    const Document = RichEditorDocumentFromMarkdown("# Heading\n\nParagraph", IdFactory());
    assert.deepEqual(Document.Blocks.map(({ Type }) => Type), [ "Heading1", "Paragraph" ]);
    assert.equal(RichEditorDocumentToMarkdown(Document.Blocks), "# Heading\n\nParagraph");
});

test("inserts, updates, moves, and deletes blocks", () =>
{
    const MakeId = IdFactory();
    let Blocks = RichEditorDocumentFromMarkdown("one", MakeId).Blocks;
    Blocks = InsertRichEditorBlock(Blocks, Blocks[0].Id, MakeId, "Quote");
    Blocks = UpdateRichEditorBlock(Blocks, Blocks[1].Id, { Markdown: "two" });
    assert.equal(RichEditorDocumentToMarkdown(Blocks), "one\n\n> two");
    Blocks = MoveRichEditorBlock(Blocks, Blocks[1].Id, -1);
    assert.equal(Blocks[0].Type, "Quote");
    Blocks = DeleteRichEditorBlock(Blocks, Blocks[1].Id, MakeId);
    assert.equal(Blocks.length, 1);
});

test("nests only list-compatible blocks and clamps depth", () =>
{
    const MakeId = IdFactory();
    let Blocks = RichEditorDocumentFromMarkdown("- parent\n- child", MakeId).Blocks;
    Blocks = IndentRichEditorBlock(Blocks, Blocks[1].Id, 1);
    assert.equal(Blocks[1].Depth, 1);
    Blocks = IndentRichEditorBlock(Blocks, Blocks[1].Id, -1);
    assert.equal(Blocks[1].Depth, 0);

    const Paragraphs = RichEditorDocumentFromMarkdown("one\n\ntwo", MakeId).Blocks;
    assert.equal(IndentRichEditorBlock(Paragraphs, Paragraphs[1].Id, 1), Paragraphs);
});

test("deleting the final block leaves one empty paragraph", () =>
{
    const MakeId = IdFactory();
    const Blocks = RichEditorDocumentFromMarkdown("only", MakeId).Blocks;
    const Next = DeleteRichEditorBlock(Blocks, Blocks[0].Id, MakeId);
    assert.equal(Next.length, 1);
    assert.equal(Next[0].Type, "Paragraph");
    assert.equal(Next[0].Markdown, "");
});
