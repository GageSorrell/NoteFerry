import assert from "node:assert/strict";
import { test } from "node:test";
import { Parse } from "../Distribution/Parser.js";
import { Serialize, SerializeInline } from "../Distribution/Serializer.js";

test("serializes every Milestone 1 block type", () => {
  const Doc = {
    Blocks: [
      { Type: "Heading", Depth: 0, Level: 2, Content: [{ Type: "Text", Text: "Title" }] },
      { Type: "Paragraph", Depth: 0, Content: [{ Type: "Text", Text: "Body" }] },
      { Type: "BulletedListItem", Depth: 0, Content: [{ Type: "Text", Text: "Item" }] },
      { Type: "NumberedListItem", Depth: 0, Content: [{ Type: "Text", Text: "First" }] },
      { Type: "ToDo", Depth: 0, Checked: true, Content: [{ Type: "Text", Text: "Done" }] },
      { Type: "Quote", Depth: 0, Content: [{ Type: "Text", Text: "Said" }] },
      { Type: "Code", Depth: 0, Language: "ts", Text: "const x = 1;" },
      { Type: "Divider", Depth: 0 },
    ],
  };
  assert.equal(
    Serialize(Doc),
    [
      "## Title",
      "Body",
      "- Item",
      "1. First",
      "- [x] Done",
      "> Said",
      "```ts\nconst x = 1;\n```",
      "---",
    ].join("\n"),
  );
});

test("indentation is serialized as literal tabs", () => {
  const Doc = {
    Blocks: [
      { Type: "BulletedListItem", Depth: 0, Content: [{ Type: "Text", Text: "Parent" }] },
      { Type: "BulletedListItem", Depth: 1, Content: [{ Type: "Text", Text: "Child" }] },
    ],
  };
  assert.equal(Serialize(Doc), "- Parent\n\t- Child");
});

test("escapes special characters in plain text but not inside code", () => {
  const Doc = {
    Blocks: [
      { Type: "Paragraph", Depth: 0, Content: [{ Type: "Text", Text: "1 * 2 = [2]" }] },
      { Type: "Code", Depth: 0, Language: null, Text: "1 * 2 = [2]" },
    ],
  };
  assert.equal(Serialize(Doc), "1 \\* 2 = \\[2\\]\n```\n1 * 2 = [2]\n```");
});

const RoundTripFixtures = [
  "Plain paragraph.",
  "# Heading one",
  "## Heading two",
  "### Heading three",
  "#### Heading four",
  "- Bulleted item",
  "1. Numbered item",
  "- [ ] Unchecked to-do",
  "- [x] Checked to-do",
  "> A quote",
  "---",
  "```js\nconst x = 1 * 2;\n```",
  ["- Parent", "\t- Child", "\t\t- Grandchild"].join("\n"),
  "**bold**, *italic*, ~~strike~~, `code`, and [a link](https://example.com).",
  "**bold *and nested italic* text**",
  "Escaped \\*asterisks\\* and \\[brackets\\].",
  ["# Document", "First paragraph.", "- One", "- Two", "> Aside", "---", "Last paragraph."].join("\n"),
];

for (const Fixture of RoundTripFixtures) {
  test(`round-trips: ${JSON.stringify(Fixture.slice(0, 40))}`, () => {
    assert.equal(Serialize(Parse(Fixture)), Fixture);
  });
}

// --- Milestone 2: Notion-specific constructs ---

test("serializes a block-level color attribute", () => {
  const Doc = { Blocks: [{ Type: "Paragraph", Depth: 0, Color: "red", Content: [{ Type: "Text", Text: "Some text" }] }] };
  assert.equal(Serialize(Doc), 'Some text {color="red"}');
});

test("serializes a callout with children, closing the tag after them", () => {
  const Doc = {
    Blocks: [
      { Type: "Callout", Depth: 0, Icon: "💡", Color: "blue_bg" },
      { Type: "Paragraph", Depth: 1, Content: [{ Type: "Text", Text: "Body" }] },
      { Type: "Paragraph", Depth: 0, Content: [{ Type: "Text", Text: "After" }] },
    ],
  };
  assert.equal(
    Serialize(Doc),
    ['<callout icon="💡" color="blue_bg">', "\tBody", "</callout>", "After"].join("\n"),
  );
});

test("serializes a toggle with a title and nested toggle, closing both tags in order", () => {
  const Doc = {
    Blocks: [
      { Type: "Toggle", Depth: 0, Content: [{ Type: "Text", Text: "Outer" }] },
      { Type: "Toggle", Depth: 1, Content: [{ Type: "Text", Text: "Inner" }] },
      { Type: "Paragraph", Depth: 2, Content: [{ Type: "Text", Text: "Leaf" }] },
      { Type: "Paragraph", Depth: 0, Content: [{ Type: "Text", Text: "Sibling" }] },
    ],
  };
  assert.equal(
    Serialize(Doc),
    [
      "<details>",
      "<summary>Outer</summary>",
      "\t<details>",
      "\t<summary>Inner</summary>",
      "\t\tLeaf",
      "\t</details>",
      "</details>",
      "Sibling",
    ].join("\n"),
  );
});

test("serializes a block equation", () => {
  const Doc = { Blocks: [{ Type: "Equation", Depth: 0, Expression: "E = mc^2" }] };
  assert.equal(Serialize(Doc), "$$\nE = mc^2\n$$");
});

test("serializes inline color, underline, equation, line break, and mentions", () => {
  const Nodes = [
    { Type: "Color", Color: "red", Children: [{ Type: "Text", Text: "red text" }] },
    { Type: "Text", Text: " " },
    { Type: "Underline", Children: [{ Type: "Text", Text: "under" }] },
    { Type: "Text", Text: " " },
    { Type: "Equation", Expression: "x^2" },
    { Type: "LineBreak" },
    { Type: "Mention", MentionKind: "user", Url: "u1", DisplayText: "Alice" },
    { Type: "Mention", MentionKind: "date", Start: "2026-01-01", End: null },
  ];
  assert.equal(
    SerializeInline(Nodes),
    '<span color="red">red text</span> <span underline="true">under</span> $x^2$<br><mention-user url="u1">Alice</mention-user><mention-date start="2026-01-01"/>',
  );
});

const RoundTripFixturesM2 = [
  'Some text {color="red"}',
  '# Title {color="blue"}',
  '- Item {color="green_bg"}',
  '- [ ] Task {color="yellow"}',
  '> Quoted {color="gray"}',
  ['<callout icon="💡" color="blue_bg">', "</callout>"].join("\n"),
  ['<callout icon="💡">', "\tBody text", "\t- Nested item", "</callout>", "After"].join("\n"),
  ['<details color="red">', "<summary>Toggle title</summary>", "\tChild paragraph", "</details>"].join("\n"),
  [
    "<details>",
    "<summary>Outer</summary>",
    "\t<details>",
    "\t<summary>Inner</summary>",
    "\t\tLeaf",
    "\t</details>",
    "</details>",
    "Sibling",
  ].join("\n"),
  "$$\nE = mc^2\n$$",
  '<span color="red">red text</span> and <span underline="true">underlined</span> text',
  "An equation: $x^2$ inline.",
  '<mention-user url="u1">Alice</mention-user> mentioned <mention-date start="2026-01-01" end="2026-01-05"/>',
];

for (const Fixture of RoundTripFixturesM2) {
  test(`round-trips (Milestone 2): ${JSON.stringify(Fixture.slice(0, 50))}`, () => {
    assert.equal(Serialize(Parse(Fixture)), Fixture);
  });
}

test("Parse(Serialize(doc)) reproduces the document", () => {
  const Doc = {
    Blocks: [
      { Type: "Heading", Depth: 0, Level: 1, Content: [{ Type: "Text", Text: "Title" }] },
      { Type: "BulletedListItem", Depth: 0, Content: [{ Type: "Bold", Children: [{ Type: "Text", Text: "bold item" }] }] },
      { Type: "BulletedListItem", Depth: 1, Content: [{ Type: "Text", Text: "nested" }] },
    ],
  };
  assert.deepEqual(Parse(Serialize(Doc)), Doc);
});
