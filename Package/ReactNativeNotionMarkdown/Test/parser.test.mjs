import assert from "node:assert/strict";
import { test } from "node:test";
import { Parse, ParseInline } from "../Distribution/Parser.js";

test("paragraph", () => {
  const Doc = Parse("Hello world");
  assert.deepEqual(Doc.Blocks, [
    { Type: "Paragraph", Depth: 0, Content: [{ Type: "Text", Text: "Hello world" }] },
  ]);
});

test("headings 1 through 4", () => {
  const Doc = Parse(["# One", "## Two", "### Three", "#### Four"].join("\n"));
  assert.deepEqual(
    Doc.Blocks.map((Block) => [Block.Type, Block.Level]),
    [
      ["Heading", 1],
      ["Heading", 2],
      ["Heading", 3],
      ["Heading", 4],
    ],
  );
});

test("bulleted and numbered lists, indented via tabs", () => {
  const Doc = Parse(["- Parent", "\t- Child", "1. First", "1. Second"].join("\n"));
  assert.deepEqual(Doc.Blocks, [
    { Type: "BulletedListItem", Depth: 0, Content: [{ Type: "Text", Text: "Parent" }] },
    { Type: "BulletedListItem", Depth: 1, Content: [{ Type: "Text", Text: "Child" }] },
    { Type: "NumberedListItem", Depth: 0, Content: [{ Type: "Text", Text: "First" }] },
    { Type: "NumberedListItem", Depth: 0, Content: [{ Type: "Text", Text: "Second" }] },
  ]);
});

test("to-do checked and unchecked", () => {
  const Doc = Parse(["- [ ] Unchecked", "- [x] Checked", "- [X] Also checked"].join("\n"));
  assert.deepEqual(
    Doc.Blocks.map((Block) => Block.Checked),
    [false, true, true],
  );
});

test("quote", () => {
  const Doc = Parse("> A quote");
  assert.deepEqual(Doc.Blocks, [
    { Type: "Quote", Depth: 0, Content: [{ Type: "Text", Text: "A quote" }] },
  ]);
});

test("divider", () => {
  const Doc = Parse("---");
  assert.deepEqual(Doc.Blocks, [{ Type: "Divider", Depth: 0 }]);
});

test("fenced code block preserves content verbatim, including markdown-special characters", () => {
  const Doc = Parse(["```js", "const x = 1 * 2;", "// *not* escaped", "```"].join("\n"));
  assert.deepEqual(Doc.Blocks, [
    {
      Type: "Code",
      Depth: 0,
      Language: "js",
      Text: "const x = 1 * 2;\n// *not* escaped",
    },
  ]);
});

test("code fence with no language", () => {
  const Doc = Parse(["```", "plain", "```"].join("\n"));
  assert.equal(Doc.Blocks[0].Language, null);
});

test("blank lines between blocks are ignored", () => {
  const Doc = Parse(["# Title", "", "", "Body"].join("\n"));
  assert.equal(Doc.Blocks.length, 2);
});

test("inline bold, italic, strikethrough, code, and link", () => {
  const Nodes = ParseInline("**bold** *italic* ~~strike~~ `code` [link](https://example.com)");
  assert.deepEqual(Nodes, [
    { Type: "Bold", Children: [{ Type: "Text", Text: "bold" }] },
    { Type: "Text", Text: " " },
    { Type: "Italic", Children: [{ Type: "Text", Text: "italic" }] },
    { Type: "Text", Text: " " },
    { Type: "Strikethrough", Children: [{ Type: "Text", Text: "strike" }] },
    { Type: "Text", Text: " " },
    { Type: "Code", Text: "code" },
    { Type: "Text", Text: " " },
    { Type: "Link", Url: "https://example.com", Children: [{ Type: "Text", Text: "link" }] },
  ]);
});

test("nested inline formatting", () => {
  const Nodes = ParseInline("**bold *and italic* text**");
  assert.deepEqual(Nodes, [
    {
      Type: "Bold",
      Children: [
        { Type: "Text", Text: "bold " },
        { Type: "Italic", Children: [{ Type: "Text", Text: "and italic" }] },
        { Type: "Text", Text: " text" },
      ],
    },
  ]);
});

test("backslash-escaped special characters are taken literally", () => {
  const Nodes = ParseInline("\\*not italic\\*");
  assert.deepEqual(Nodes, [{ Type: "Text", Text: "*not italic*" }]);
});

test("code spans are not escape-processed", () => {
  const Nodes = ParseInline("`\\* raw \\*`");
  assert.deepEqual(Nodes, [{ Type: "Code", Text: "\\* raw \\*" }]);
});

// --- Milestone 2: Notion-specific constructs ---

test("block-level color attribute", () => {
  const Doc = Parse('Some text {color="red"}');
  assert.deepEqual(Doc.Blocks, [
    { Type: "Paragraph", Depth: 0, Color: "red", Content: [{ Type: "Text", Text: "Some text" }] },
  ]);
});

test("block-level color attribute on a heading, list item, to-do, and quote", () => {
  const Doc = Parse(
    ['# Title {color="blue"}', '- Item {color="green_bg"}', '- [ ] Task {color="yellow"}', '> Quoted {color="gray"}'].join("\n"),
  );
  assert.deepEqual(
    Doc.Blocks.map((Block) => Block.Color),
    ["blue", "green_bg", "yellow", "gray"],
  );
});

test("an unrecognized color value is left as literal text, not stripped", () => {
  const Doc = Parse('Text {color="not-a-color"}');
  assert.equal(Doc.Blocks[0].Color, undefined);
  assert.equal(Doc.Blocks[0].Content[0].Text, 'Text {color="not-a-color"}');
});

test("callout with an icon and color, no children", () => {
  const Doc = Parse(['<callout icon="💡" color="blue_bg">', "</callout>"].join("\n"));
  assert.deepEqual(Doc.Blocks, [{ Type: "Callout", Depth: 0, Icon: "💡", Color: "blue_bg" }]);
});

test("callout with a body and a nested list, via tab depth", () => {
  const Doc = Parse(['<callout icon="💡">', "\tBody text", "\t- Nested item", "</callout>", "After"].join("\n"));
  assert.deepEqual(Doc.Blocks, [
    { Type: "Callout", Depth: 0, Icon: "💡" },
    { Type: "Paragraph", Depth: 1, Content: [{ Type: "Text", Text: "Body text" }] },
    { Type: "BulletedListItem", Depth: 1, Content: [{ Type: "Text", Text: "Nested item" }] },
    { Type: "Paragraph", Depth: 0, Content: [{ Type: "Text", Text: "After" }] },
  ]);
});

test("callout without an icon attribute has a null Icon", () => {
  const Doc = Parse(["<callout>", "</callout>"].join("\n"));
  assert.equal(Doc.Blocks[0].Icon, null);
});

test("toggle with a title and an indented child", () => {
  const Doc = Parse(['<details color="red">', "<summary>Toggle title</summary>", "\tChild paragraph", "</details>"].join("\n"));
  assert.deepEqual(Doc.Blocks, [
    { Type: "Toggle", Depth: 0, Color: "red", Content: [{ Type: "Text", Text: "Toggle title" }] },
    { Type: "Paragraph", Depth: 1, Content: [{ Type: "Text", Text: "Child paragraph" }] },
  ]);
});

test("nested toggles close at the correct depth", () => {
  const Doc = Parse(
    ["<details>", "<summary>Outer</summary>", "\t<details>", "\t<summary>Inner</summary>", "\t\tLeaf", "\t</details>", "</details>", "Sibling"].join(
      "\n",
    ),
  );
  assert.deepEqual(
    Doc.Blocks.map((Block) => [Block.Type, Block.Depth]),
    [
      ["Toggle", 0],
      ["Toggle", 1],
      ["Paragraph", 2],
      ["Paragraph", 0],
    ],
  );
});

test("block equation", () => {
  const Doc = Parse(["$$", "E = mc^2", "$$"].join("\n"));
  assert.deepEqual(Doc.Blocks, [{ Type: "Equation", Depth: 0, Expression: "E = mc^2" }]);
});

test("inline color span, underline span, equation, and line break", () => {
  const Nodes = ParseInline('<span color="red">red text</span> <span underline="true">underlined</span> $x^2$ line one<br>line two');
  assert.deepEqual(Nodes, [
    { Type: "Color", Color: "red", Children: [{ Type: "Text", Text: "red text" }] },
    { Type: "Text", Text: " " },
    { Type: "Underline", Children: [{ Type: "Text", Text: "underlined" }] },
    { Type: "Text", Text: " " },
    { Type: "Equation", Expression: "x^2" },
    { Type: "Text", Text: " line one" },
    { Type: "LineBreak" },
    { Type: "Text", Text: "line two" },
  ]);
});

test("mention tags: user, page, database, and date", () => {
  const Nodes = ParseInline(
    [
      '<mention-user url="u1">Alice</mention-user>',
      '<mention-page url="p1">Roadmap</mention-page>',
      '<mention-database url="d1">Tasks</mention-database>',
      '<mention-date start="2026-01-01" end="2026-01-05"/>',
      '<mention-date start="2026-01-01"/>',
    ].join(" "),
  );
  assert.deepEqual(
    Nodes.filter((Node) => Node.Type === "Mention"),
    [
      { Type: "Mention", MentionKind: "user", Url: "u1", DisplayText: "Alice" },
      { Type: "Mention", MentionKind: "page", Url: "p1", DisplayText: "Roadmap" },
      { Type: "Mention", MentionKind: "database", Url: "d1", DisplayText: "Tasks" },
      { Type: "Mention", MentionKind: "date", Start: "2026-01-01", End: "2026-01-05" },
      { Type: "Mention", MentionKind: "date", Start: "2026-01-01", End: null },
    ],
  );
});
