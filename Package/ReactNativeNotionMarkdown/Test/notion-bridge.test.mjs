import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApiColorToColorValue,
  ChunkChildren,
  ColorValueToApiColor,
  DocumentToNotionBlocks,
  InlineNodesToRichText,
  MaxBlockChildren,
  MaxRichTextLength,
  NotionBlocksToDocument,
  RichTextToInlineNodes,
} from "../Distribution/NotionBridge.js";

test("color mapping: our `_bg` suffix <-> Notion's `_background` ApiColor", () => {
  assert.equal(ColorValueToApiColor("red"), "red");
  assert.equal(ColorValueToApiColor("red_bg"), "red_background");
  assert.equal(ApiColorToColorValue("red"), "red");
  assert.equal(ApiColorToColorValue("red_background"), "red_bg");
  assert.equal(ApiColorToColorValue("default"), "default");
});

test("inline nodes to rich text: plain text and basic annotations", () => {
  const RichText = InlineNodesToRichText([
    { Type: "Text", Text: "plain " },
    { Type: "Bold", Children: [{ Type: "Text", Text: "bold" }] },
    { Type: "Code", Text: "code" },
  ]);
  assert.deepEqual(RichText, [
    { type: "text", text: { content: "plain ", link: null } },
    { type: "text", text: { content: "bold", link: null }, annotations: { bold: true } },
    { type: "text", text: { content: "code", link: null }, annotations: { code: true } },
  ]);
});

test("inline nodes to rich text: nested annotations accumulate", () => {
  const RichText = InlineNodesToRichText([
    { Type: "Bold", Children: [{ Type: "Italic", Children: [{ Type: "Text", Text: "both" }] }] },
  ]);
  assert.deepEqual(RichText, [{ type: "text", text: { content: "both", link: null }, annotations: { bold: true, italic: true } }]);
});

test("inline nodes to rich text: color annotation uses the real ApiColor spelling", () => {
  const RichText = InlineNodesToRichText([{ Type: "Color", Color: "red_bg", Children: [{ Type: "Text", Text: "x" }] }]);
  assert.deepEqual(RichText, [{ type: "text", text: { content: "x", link: null }, annotations: { color: "red_background" } }]);
});

test("inline nodes to rich text: link attaches url to the text item", () => {
  const RichText = InlineNodesToRichText([{ Type: "Link", Url: "https://example.com", Children: [{ Type: "Text", Text: "click" }] }]);
  assert.deepEqual(RichText, [{ type: "text", text: { content: "click", link: { url: "https://example.com" } } }]);
});

test("inline nodes to rich text: equation and mention become their own item types", () => {
  const PageId = "59833787-2cf9-4fdf-8782-e53db20768a5";
  const RichText = InlineNodesToRichText([
    { Type: "Equation", Expression: "x^2" },
    { Type: "Mention", MentionKind: "page", Url: PageId, DisplayText: "Roadmap" },
  ]);
  // No `plain_text`: Notion derives it, and rejects it in a request.
  assert.deepEqual(RichText, [
    { type: "equation", equation: { expression: "x^2" } },
    { type: "mention", mention: { type: "page", page: { id: PageId } } },
  ]);
});

test("inline nodes to rich text: a mention Notion could not resolve is sent as its display text", () => {
  const RichText = InlineNodesToRichText([{ Type: "Mention", MentionKind: "user", Url: "u1", DisplayText: "Ada Lovelace" }]);
  assert.deepEqual(RichText, [{ type: "text", text: { content: "Ada Lovelace", link: null } }]);
});

test("inline nodes to rich text: text runs longer than the limit are chunked", () => {
  const LongText = "a".repeat(MaxRichTextLength + 10);
  const RichText = InlineNodesToRichText([{ Type: "Text", Text: LongText }]);
  assert.equal(RichText.length, 2);
  assert.equal(RichText[0].text.content.length, MaxRichTextLength);
  assert.equal(RichText[1].text.content.length, 10);
  assert.equal(RichText[0].text.content + RichText[1].text.content, LongText);
});

test("rich text to inline nodes: round-trips basic annotations and merges adjacent plain text", () => {
  const Nodes = [
    { Type: "Text", Text: "plain " },
    { Type: "Bold", Children: [{ Type: "Text", Text: "bold" }] },
  ];
  const RoundTripped = RichTextToInlineNodes(InlineNodesToRichText(Nodes));
  assert.deepEqual(RoundTripped, Nodes);
});

test("rich text to inline nodes: a chunked long run merges back into one Text node", () => {
  const LongText = "a".repeat(MaxRichTextLength + 10);
  const RoundTripped = RichTextToInlineNodes(InlineNodesToRichText([{ Type: "Text", Text: LongText }]));
  assert.deepEqual(RoundTripped, [{ Type: "Text", Text: LongText }]);
});

test("rich text to inline nodes: color and link round-trip", () => {
  const Nodes = [
    { Type: "Color", Color: "green_bg", Children: [{ Type: "Text", Text: "x" }] },
    { Type: "Link", Url: "https://example.com", Children: [{ Type: "Text", Text: "click" }] },
  ];
  assert.deepEqual(RichTextToInlineNodes(InlineNodesToRichText(Nodes)), Nodes);
});

test("document to Notion blocks: nests children by depth", () => {
  const Doc = {
    Blocks: [
      { Type: "BulletedListItem", Depth: 0, Content: [{ Type: "Text", Text: "Parent" }] },
      { Type: "BulletedListItem", Depth: 1, Content: [{ Type: "Text", Text: "Child" }] },
      { Type: "Paragraph", Depth: 0, Content: [{ Type: "Text", Text: "Sibling" }] },
    ],
  };
  const Blocks = DocumentToNotionBlocks(Doc);
  assert.equal(Blocks.length, 2);
  assert.equal(Blocks[0].type, "bulleted_list_item");
  // Notion's request shape: children sit inside the parent's type object, never beside it.
  assert.equal(Blocks[0].children, undefined);
  assert.equal(Blocks[0].bulleted_list_item.children.length, 1);
  assert.equal(Blocks[0].bulleted_list_item.children[0].bulleted_list_item.rich_text[0].text.content, "Child");
  assert.equal(Blocks[1].type, "paragraph");
  assert.equal("children" in Blocks[1].paragraph, false);
});

test("document to Notion blocks: heading maps to the matching heading_N type", () => {
  const Doc = { Blocks: [{ Type: "Heading", Depth: 0, Level: 4, Content: [{ Type: "Text", Text: "Title" }] }] };
  const [Block] = DocumentToNotionBlocks(Doc);
  assert.equal(Block.type, "heading_4");
  assert.equal(Block.heading_4.rich_text[0].text.content, "Title");
});

test("document to Notion blocks: to-do, code, divider, and equation", () => {
  const Doc = {
    Blocks: [
      { Type: "ToDo", Depth: 0, Checked: true, Content: [{ Type: "Text", Text: "Done" }] },
      { Type: "Code", Depth: 0, Language: "ts", Text: "const x = 1;" },
      { Type: "Divider", Depth: 0 },
      { Type: "Equation", Depth: 0, Expression: "E = mc^2" },
    ],
  };
  const Blocks = DocumentToNotionBlocks(Doc);
  assert.equal(Blocks[0].to_do.checked, true);
  assert.equal(Blocks[1].code.language, "typescript");
  assert.deepEqual(Blocks[2].divider, {});
  assert.equal(Blocks[3].equation.expression, "E = mc^2");
});

test("document to Notion blocks: a callout's leading paragraph becomes its own text, the rest its children", () => {
  const Doc = {
    Blocks: [
      { Type: "Callout", Depth: 0, Icon: "💡", Color: "blue_bg" },
      { Type: "Paragraph", Depth: 1, Content: [{ Type: "Text", Text: "Body" }] },
      { Type: "BulletedListItem", Depth: 1, Content: [{ Type: "Text", Text: "Point" }] },
    ],
  };
  const [Block] = DocumentToNotionBlocks(Doc);
  assert.equal(Block.type, "callout");
  assert.equal(Block.callout.rich_text[0].text.content, "Body");
  assert.deepEqual(Block.callout.icon, { type: "emoji", emoji: "💡" });
  assert.equal(Block.callout.color, "blue_background");
  assert.equal(Block.callout.children.length, 1);
  assert.equal(Block.callout.children[0].bulleted_list_item.rich_text[0].text.content, "Point");
  assert.deepEqual(NotionBlocksToDocument([Block]), Doc, "and flattening restores the leading paragraph");
});

test("document to Notion blocks: a callout whose first child is not a plain paragraph keeps every child", () => {
  const Doc = {
    Blocks: [
      { Type: "Callout", Depth: 0, Icon: "not an emoji" },
      { Type: "BulletedListItem", Depth: 1, Content: [{ Type: "Text", Text: "Point" }] },
    ],
  };
  const [Block] = DocumentToNotionBlocks(Doc);
  assert.deepEqual(Block.callout.rich_text, []);
  assert.equal("icon" in Block.callout, false, "an icon Notion would reject is left off");
  assert.equal(Block.callout.children.length, 1);
});

test("Notion blocks to document: flattens nested children back to Depth", () => {
  const Blocks = [
    {
      type: "bulleted_list_item",
      bulleted_list_item: { rich_text: [{ type: "text", text: { content: "Parent", link: null } }] },
      children: [
        { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: "Child", link: null } }] } },
      ],
    },
    { type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: "Sibling", link: null } }] } },
  ];
  const Doc = NotionBlocksToDocument(Blocks);
  assert.deepEqual(
    Doc.Blocks.map((Block) => [Block.Type, Block.Depth]),
    [
      ["BulletedListItem", 0],
      ["BulletedListItem", 1],
      ["Paragraph", 0],
    ],
  );
});

test("Notion blocks to document: a callout's own rich_text becomes a synthetic leading Paragraph child", () => {
  const Blocks = [
    {
      type: "callout",
      callout: { rich_text: [{ type: "text", text: { content: "Heads up", link: null } }], icon: { type: "emoji", emoji: "💡" } },
      children: [{ type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: "More", link: null } }] } }],
    },
  ];
  const Doc = NotionBlocksToDocument(Blocks);
  assert.deepEqual(
    Doc.Blocks.map((Block) => [Block.Type, Block.Depth]),
    [
      ["Callout", 0],
      ["Paragraph", 1],
      ["Paragraph", 1],
    ],
  );
  assert.equal(Doc.Blocks[1].Content[0].Text, "Heads up");
  assert.equal(Doc.Blocks[2].Content[0].Text, "More");
});

test("document round-trips through the Notion block bridge (excluding Callout's documented one-way normalization)", () => {
  const Doc = {
    Blocks: [
      { Type: "Heading", Depth: 0, Level: 2, Content: [{ Type: "Text", Text: "Title" }] },
      { Type: "BulletedListItem", Depth: 0, Content: [{ Type: "Bold", Children: [{ Type: "Text", Text: "item" }] }] },
      { Type: "BulletedListItem", Depth: 1, Content: [{ Type: "Text", Text: "nested" }] },
      { Type: "ToDo", Depth: 0, Checked: true, Content: [{ Type: "Text", Text: "done" }] },
      { Type: "Quote", Depth: 0, Content: [{ Type: "Text", Text: "said" }] },
      { Type: "Toggle", Depth: 0, Content: [{ Type: "Text", Text: "toggle" }] },
      { Type: "Paragraph", Depth: 1, Content: [{ Type: "Text", Text: "child" }] },
      { Type: "Divider", Depth: 0 },
      { Type: "Equation", Depth: 0, Expression: "E = mc^2" },
    ],
  };
  const RoundTripped = NotionBlocksToDocument(DocumentToNotionBlocks(Doc));
  assert.deepEqual(RoundTripped, Doc);
});

test("ChunkChildren splits into groups of at most MaxBlockChildren", () => {
  const Blocks = Array.from({ length: MaxBlockChildren + 5 }, (_unused, Index) => ({
    type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content: String(Index), link: null } }] },
  }));
  const Chunks = ChunkChildren(Blocks);
  assert.equal(Chunks.length, 2);
  assert.equal(Chunks[0].length, MaxBlockChildren);
  assert.equal(Chunks[1].length, 5);
});

test("ChunkChildren on an empty array returns one empty chunk", () => {
  assert.deepEqual(ChunkChildren([]), [[]]);
});
