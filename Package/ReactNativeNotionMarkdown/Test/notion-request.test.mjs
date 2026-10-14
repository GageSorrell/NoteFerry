import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AppendNotionBlocks,
  ChunkText,
  DocumentToNotionBlocks,
  GetNotionBlockChildren,
  MarkdownToNotionBlocks,
  MaxBlockChildren,
  MaxBlockTextLength,
  MaxEquationLength,
  MaxNestingLevels,
  MaxRequestBlocks,
  MaxRequestBytes,
  MaxRichTextItems,
  MaxRichTextLength,
  NormalizeCodeLanguage,
  NormalizeLinkUrl,
  NotionBlocksToDocument,
  Parse,
  PlainTextToNotionBlocks,
  PlanPageChildren,
  Serialize,
  WithNotionBlockChildren,
} from "../Distribution/Core.js";

const PlainContent = (Block) => Block[Block.type].rich_text.map((Item) => Item.text.content).join("");
const Paragraph = (Text, Children = []) => ({ type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: Text, link: null } }], ...(Children.length > 0 ? { children: Children } : {}) } });

// --- A stand-in for Notion that enforces its request limits ----------------

/**
 * Checks one request body against every limit Notion documents, the way the
 * real API would reject it. Counts are taken from the blocks as sent.
 */
function AssertAcceptable(Children, Label) {
  assert.ok(Children.length > 0, `${Label}: an empty children array`);
  assert.ok(Children.length <= MaxBlockChildren, `${Label}: ${Children.length} blocks in one children array`);
  let Total = 0;
  const Visit = (Block, Level) => {
    Total += 1;
    assert.equal(Block.children, undefined, `${Label}: children beside the type object`);
    const Content = Block[Block.type];
    for (const Item of Content.rich_text ?? []) {
      assert.ok(!("plain_text" in Item), `${Label}: plain_text in a request`);
      if (Item.type === "text") {
        assert.ok(Item.text.content.length <= MaxRichTextLength, `${Label}: ${Item.text.content.length}-character text item`);
        assert.ok(Item.text.content.isWellFormed(), `${Label}: a split surrogate pair`);
      }
      if (Item.type === "equation") assert.ok(Item.equation.expression.length <= MaxEquationLength, `${Label}: over-long equation`);
    }
    assert.ok((Content.rich_text ?? []).length <= MaxRichTextItems, `${Label}: ${(Content.rich_text ?? []).length} rich text items`);
    if (Block.type === "equation") assert.ok(Content.expression.length <= MaxEquationLength, `${Label}: over-long equation block`);
    const Nested = Content.children ?? [];
    if (Nested.length > 0) {
      assert.ok(Level < MaxNestingLevels, `${Label}: children ${Level + 1} levels deep`);
      assert.ok(Nested.length <= MaxBlockChildren, `${Label}: ${Nested.length} nested children`);
      if (Block.type.startsWith("heading_")) assert.equal(Content.is_toggleable, true, `${Label}: children under a non-toggle heading`);
    }
    for (const Child of Nested) Visit(Child, Level + 1);
  };
  for (const Block of Children) Visit(Block, 0);
  assert.ok(Total <= MaxRequestBlocks, `${Label}: ${Total} blocks in one request`);
  assert.ok(Buffer.byteLength(JSON.stringify({ children: Children })) <= 500_000, `${Label}: payload over 500KB`);
}

/** Records what a sequence of requests builds, so the result can be compared with the tree that was meant to be built. */
function FakeNotion() {
  const ChildrenOf = new Map([["page", []]]);
  let NextId = 0;
  let Requests = 0;

  const Store = (ParentId, Blocks) => {
    const Ids = [];
    for (const Block of Blocks) {
      const Id = `block-${(NextId += 1)}`;
      Ids.push(Id);
      ChildrenOf.get(ParentId).push({ Id, Block: WithNotionBlockChildren(Block, []) });
      ChildrenOf.set(Id, []);
      Store(Id, GetNotionBlockChildren(Block));
    }
    return Ids;
  };

  const Read = (ParentId) => ChildrenOf.get(ParentId).map(({ Id, Block }) => WithNotionBlockChildren(Block, Read(Id)));

  return {
    /** The Create Page request: accepts children, reports no block ids. */
    Create: (Children) => {
      if (Children.length > 0) AssertAcceptable(Children, "create page");
      Store("page", Children);
    },
    Append: async (ParentId, Children) => {
      Requests += 1;
      assert.ok(ChildrenOf.has(ParentId), `append to unknown parent ${ParentId}`);
      AssertAcceptable(Children, `append #${Requests}`);
      return Store(ParentId, Children);
    },
    Tree: () => Read("page"),
    Requests: () => Requests,
  };
}

/** Creates a page from `Blocks` the way the server does, and returns what Notion ends up holding. */
async function CreatePage(Blocks) {
  const Notion = FakeNotion();
  const Plan = PlanPageChildren(Blocks);
  Notion.Create(Plan.Initial);
  await AppendNotionBlocks(Notion.Append, "page", Plan.Remaining);
  return { Tree: Notion.Tree(), Requests: Notion.Requests(), Plan };
}

// --- Plain text ------------------------------------------------------------

test("plain text arrives as literal paragraphs: Markdown syntax is not interpreted", () => {
  const Body = "# Not a heading\n- [ ] not a task\n**not bold** and `not code`\n> not a quote\n1. not a list\n---\n$x^2$ <span color=\"red\">not red</span>";
  const Blocks = PlainTextToNotionBlocks(Body);

  assert.deepEqual(Blocks.map((Block) => Block.type), Array(7).fill("paragraph"));
  assert.deepEqual(Blocks.map(PlainContent), Body.split("\n"));
  for (const Block of Blocks) {
    assert.deepEqual(Object.keys(Block.paragraph.rich_text[0]).sort(), ["text", "type"], "no annotations");
    assert.equal(Block.paragraph.rich_text[0].text.link, null);
  }
});

test("plain text keeps its line breaks, blank lines included", () => {
  const Blocks = PlainTextToNotionBlocks("first\r\n\r\nthird\n  indented\n\n\n");
  assert.deepEqual(Blocks.map(PlainContent), ["first", "", "third", "  indented"]);
  assert.deepEqual(Blocks[1].paragraph.rich_text, []);
});

test("plain text that is empty or only whitespace produces no blocks", () => {
  assert.deepEqual(PlainTextToNotionBlocks(""), []);
  assert.deepEqual(PlainTextToNotionBlocks("  \n\n \t"), []);
});

test("a very long plain-text line is split into text items, then paragraphs, losing nothing", async () => {
  const Line = "é".repeat(130_000);
  const Blocks = PlainTextToNotionBlocks(`before\n${Line}\nafter`);

  assert.equal(Blocks.map(PlainContent).join("|"), `before|${Line.slice(0, 50_000)}|${Line.slice(50_000, 100_000)}|${Line.slice(100_000)}|after`);
  const { Tree } = await CreatePage(Blocks);
  assert.deepEqual(Tree, Blocks);
});

// --- Rich conversion -------------------------------------------------------

const EveryBlock = [
  "# Heading 1",
  "## Heading 2",
  "### Heading 3",
  "#### Heading 4",
  "Plain with **bold**, *italic*, ~~strike~~, `code`, <span underline=\"true\">underline</span>, and a [link](https://notion.so).",
  "<span color=\"red\">red</span> and <span color=\"blue_bg\">blue background</span> and $E = mc^2$",
  "- Bulleted",
  "\t- Nested bullet",
  "1. Numbered",
  "- [ ] Open task",
  "- [x] Done task",
  "> Quoted {color=\"gray\"}",
  "```typescript",
  "const x = 1;",
  "```",
  "---",
  "<callout icon=\"💡\" color=\"blue_bg\">",
  "\tCallout text",
  "\t- Callout bullet",
  "</callout>",
  "<details>",
  "<summary>Toggle title</summary>",
  "\tHidden body",
  "</details>",
  "$$",
  "\\int_0^1 x^2 dx",
  "$$",
].join("\n");

test("every supported block and inline format converts to the request shape Notion documents", () => {
  const Blocks = MarkdownToNotionBlocks(EveryBlock);
  AssertAcceptable(Blocks, "every block");

  assert.deepEqual(Blocks.map((Block) => Block.type), [
    "heading_1", "heading_2", "heading_3", "heading_4", "paragraph", "paragraph", "bulleted_list_item", "numbered_list_item",
    "to_do", "to_do", "quote", "code", "divider", "callout", "toggle", "equation",
  ]);

  const Formatted = Blocks[4].paragraph.rich_text;
  const Annotated = (Text) => Formatted.find((Item) => Item.text.content === Text);
  assert.deepEqual(Annotated("bold").annotations, { bold: true });
  assert.deepEqual(Annotated("italic").annotations, { italic: true });
  assert.deepEqual(Annotated("strike").annotations, { strikethrough: true });
  assert.deepEqual(Annotated("code").annotations, { code: true });
  assert.deepEqual(Annotated("underline").annotations, { underline: true });
  assert.deepEqual(Annotated("link").text.link, { url: "https://notion.so" });

  const Colored = Blocks[5].paragraph.rich_text;
  assert.equal(Colored[0].annotations.color, "red");
  assert.equal(Colored[2].annotations.color, "blue_background");
  assert.deepEqual(Colored[4], { type: "equation", equation: { expression: "E = mc^2" } });

  assert.equal(Blocks[6].bulleted_list_item.children[0].bulleted_list_item.rich_text[0].text.content, "Nested bullet");
  assert.equal(Blocks[8].to_do.checked, false);
  assert.equal(Blocks[9].to_do.checked, true);
  assert.equal(Blocks[10].quote.color, "gray");
  assert.deepEqual(Blocks[11].code, { rich_text: [{ type: "text", text: { content: "const x = 1;", link: null } }], language: "typescript" });
  assert.deepEqual(Blocks[12].divider, {});
  assert.equal(PlainContent(Blocks[13]), "Callout text");
  assert.deepEqual(Blocks[13].callout.icon, { type: "emoji", emoji: "💡" });
  assert.equal(Blocks[13].callout.color, "blue_background");
  assert.equal(Blocks[13].callout.children[0].type, "bulleted_list_item");
  assert.equal(PlainContent(Blocks[14]), "Toggle title");
  assert.equal(PlainContent(Blocks[14].toggle.children[0]), "Hidden body");
  assert.equal(Blocks[15].equation.expression, "\\int_0^1 x^2 dx");
});

test("the editor's Markdown survives conversion to Notion blocks and back", () => {
  const Blocks = MarkdownToNotionBlocks(EveryBlock);
  assert.equal(Serialize(NotionBlocksToDocument(Blocks)), Serialize(Parse(EveryBlock)));
});

test("blocks nested under a heading make it a toggle heading, as Notion requires", () => {
  const [Heading] = MarkdownToNotionBlocks("## Section\n\tInside");
  assert.equal(Heading.heading_2.is_toggleable, true);
  assert.equal(PlainContent(Heading.heading_2.children[0]), "Inside");
  assert.equal("is_toggleable" in MarkdownToNotionBlocks("## Section")[0].heading_2, false);
});

test("blocks nested under a block that cannot hold children follow it instead of being dropped", () => {
  const Doc = {
    Blocks: [
      { Type: "Divider", Depth: 0 },
      { Type: "Paragraph", Depth: 1, Content: [{ Type: "Text", Text: "under divider" }] },
      { Type: "Code", Depth: 0, Language: null, Text: "x" },
      { Type: "Paragraph", Depth: 1, Content: [{ Type: "Text", Text: "under code" }] },
    ],
  };
  const Blocks = DocumentToNotionBlocks(Doc);
  assert.deepEqual(Blocks.map((Block) => Block.type), ["divider", "paragraph", "code", "paragraph"]);
  assert.deepEqual([Blocks[1], Blocks[3]].map(PlainContent), ["under divider", "under code"]);
  AssertAcceptable(Blocks, "hoisted children");
});

test("code languages map to Notion's names, and unknown ones to plain text", () => {
  assert.equal(NormalizeCodeLanguage("ts"), "typescript");
  assert.equal(NormalizeCodeLanguage("JS"), "javascript");
  assert.equal(NormalizeCodeLanguage("python"), "python");
  assert.equal(NormalizeCodeLanguage("c++"), "c++");
  assert.equal(NormalizeCodeLanguage(null), "plain text");
  assert.equal(NormalizeCodeLanguage(""), "plain text");
  assert.equal(NormalizeCodeLanguage("klingon"), "plain text");
});

test("links Notion would reject keep their text and lose only the link", () => {
  assert.equal(NormalizeLinkUrl("https://notion.so/page?x=1"), "https://notion.so/page?x=1");
  assert.equal(NormalizeLinkUrl("notion.so/page"), "https://notion.so/page");
  assert.equal(NormalizeLinkUrl("mailto:ada@example.com"), "mailto:ada@example.com");
  assert.equal(NormalizeLinkUrl("not a url"), undefined);
  assert.equal(NormalizeLinkUrl("javascript:alert(1)"), undefined);
  assert.equal(NormalizeLinkUrl(`https://example.com/${"a".repeat(2000)}`), undefined);

  const [Block] = MarkdownToNotionBlocks("[label](nowhere)");
  assert.deepEqual(Block.paragraph.rich_text, [{ type: "text", text: { content: "label", link: null } }]);
});

test("long code gets the same size handling as other rich text: 2,000-character items, then further code blocks", async () => {
  const Code = Array.from({ length: 9000 }, (_, Index) => `const value${Index} = ${Index}; // 😀`).join("\n");
  assert.ok(Code.length > 250_000);
  const Blocks = MarkdownToNotionBlocks(`\`\`\`ts\n${Code}\n\`\`\``);

  assert.ok(Blocks.length > 1);
  for (const Block of Blocks) {
    assert.equal(Block.type, "code");
    assert.equal(Block.code.language, "typescript");
  }
  AssertAcceptable(Blocks, "long code");
  assert.equal(Blocks.map(PlainContent).join(""), Code);

  const { Tree } = await CreatePage(Blocks);
  assert.deepEqual(Tree, Blocks);
});

test("text chunks never split a surrogate pair", () => {
  const Text = `${"a".repeat(1999)}😀${"b".repeat(10)}`;
  const Chunks = ChunkText(Text, 2000);
  assert.deepEqual(Chunks.map((Chunk) => Chunk.length), [1999, 12]);
  assert.equal(Chunks.join(""), Text);
  assert.ok(Chunks.every((Chunk) => Chunk.isWellFormed()));
});

test("a paragraph with more formatted runs than one rich-text array may hold continues in further paragraphs", () => {
  const Runs = Array.from({ length: 250 }, (_, Index) => `**b${Index}** t${Index} `).join("");
  const Blocks = MarkdownToNotionBlocks(`- ${Runs}\n\t- child`);
  AssertAcceptable(Blocks, "many runs");

  const [Item] = Blocks;
  assert.equal(Item.type, "bulleted_list_item");
  assert.equal(Item.bulleted_list_item.rich_text.length, MaxRichTextItems);
  const Nested = Item.bulleted_list_item.children;
  // The overflow comes before the item's real child, so the text still reads in order.
  assert.deepEqual(Nested.map((Block) => Block.type), ["paragraph", "paragraph", "paragraph", "paragraph", "bulleted_list_item"]);
  assert.equal([Item, ...Nested.slice(0, -1)].map(PlainContent).join(""), Runs.replaceAll("**", ""));
});

test("an equation too long for Notion's equation type is kept as LaTeX source", () => {
  const Expression = "x + ".repeat(300) + "y";
  const Blocks = MarkdownToNotionBlocks(`$$\n${Expression}\n$$\ninline $${Expression}$ here`);
  AssertAcceptable(Blocks, "long equation");
  assert.equal(Blocks[0].type, "code");
  assert.equal(Blocks[0].code.language, "latex");
  assert.equal(PlainContent(Blocks[0]), Expression);
  assert.equal(PlainContent(Blocks[1]), `inline $${Expression}$ here`);
});

// --- Request planning ------------------------------------------------------

test("a small body goes entirely into the Create Page request", async () => {
  const Blocks = MarkdownToNotionBlocks(EveryBlock);
  const { Plan, Requests, Tree } = await CreatePage(Blocks);
  assert.equal(Plan.Remaining.length, 0);
  assert.equal(Requests, 0);
  assert.deepEqual(Tree, Blocks);
});

test("an empty body plans nothing and sends nothing", async () => {
  const { Plan, Requests } = await CreatePage([]);
  assert.deepEqual(Plan, { Initial: [], Remaining: [] });
  assert.equal(Requests, 0);
});

test("more than 100 top-level blocks are appended in order across requests", async () => {
  const Blocks = Array.from({ length: 345 }, (_, Index) => Paragraph(`line ${Index}`));
  const { Plan, Requests, Tree } = await CreatePage(Blocks);
  assert.equal(Plan.Initial.length, 100);
  assert.equal(Requests, 3);
  assert.deepEqual(Tree.map(PlainContent), Blocks.map(PlainContent));
});

test("blocks nested deeper than one request allows are appended to their own parents, in order", async () => {
  const Markdown = [
    "- a",
    "\t- a.1",
    "\t\t- a.1.1",
    "\t\t\t- a.1.1.1",
    "\t\t\t\t- a.1.1.1.1",
    "\t\t\t- a.1.1.2",
    "\t\t- a.1.2",
    "\t- a.2",
    "- b",
    "\t- b.1",
    "after",
  ].join("\n");
  const Blocks = MarkdownToNotionBlocks(Markdown);
  const { Plan, Tree, Requests } = await CreatePage(Blocks);

  assert.deepEqual(Plan.Initial, [], "the first block needs its id, so nothing can ride along with page creation");
  assert.ok(Requests > 1);
  assert.deepEqual(Tree, Blocks);
  assert.equal(Serialize(NotionBlocksToDocument(Tree)), Markdown);
});

test("blocks ahead of the first one that needs separate appends still ride along with page creation", async () => {
  const Blocks = MarkdownToNotionBlocks("intro\n- shallow\n\t- child\n- deep\n\t- 1\n\t\t- 2\n\t\t\t- 3\nend");
  const { Plan, Tree } = await CreatePage(Blocks);
  assert.deepEqual(Plan.Initial.map(PlainContent), ["intro", "shallow"]);
  assert.deepEqual(Plan.Remaining.map(PlainContent), ["deep", "end"]);
  assert.deepEqual(Tree, Blocks);
});

test("a parent with more than 100 children has them appended in order", async () => {
  const Children = Array.from({ length: 250 }, (_, Index) => Paragraph(`child ${Index}`));
  const Blocks = [Paragraph("before"), { type: "toggle", toggle: { rich_text: [], children: Children } }, Paragraph("after")];
  const { Tree } = await CreatePage(Blocks);
  assert.deepEqual(Tree, Blocks);
  assert.deepEqual(GetNotionBlockChildren(Tree[1]).map(PlainContent), Children.map(PlainContent));
});

test("a request never carries more than 1,000 blocks, however they are nested", async () => {
  // 60 parents x 30 children: 1,860 blocks, each parent complete in itself, 60 top-level blocks.
  const Blocks = Array.from({ length: 60 }, (_, Parent) => Paragraph(`p${Parent}`, Array.from({ length: 30 }, (_, Child) => Paragraph(`p${Parent}.c${Child}`))));
  const { Plan, Tree, Requests } = await CreatePage(Blocks);
  assert.equal(Plan.Initial.length, 32, "32 x 31 = 992 blocks fit; a 33rd parent would not");
  assert.equal(Requests, 1);
  assert.deepEqual(Tree, Blocks);
});

test("a subtree too large for one request is sent as its root, then its children", async () => {
  const Wide = Paragraph("root", Array.from({ length: 40 }, (_, A) => Paragraph(`a${A}`, Array.from({ length: 40 }, (_, B) => Paragraph(`a${A}.b${B}`)))));
  const { Tree } = await CreatePage([Wide]);
  assert.deepEqual(Tree, [Wide]);
});

test("requests stay under the payload ceiling when every character takes several bytes", async () => {
  const Line = "漢".repeat(40_000);
  const Blocks = PlainTextToNotionBlocks(Array(5).fill(Line).join("\n"));
  assert.ok(Buffer.byteLength(JSON.stringify(Blocks)) > 500_000, "the body as a whole exceeds one request");
  const { Tree, Requests } = await CreatePage(Blocks);
  assert.ok(Requests >= 1);
  assert.deepEqual(Tree, Blocks);
  assert.ok(MaxRequestBytes < 500_000);
  assert.ok(MaxBlockTextLength * 4 < MaxRequestBytes, "one full block always fits in a request");
});

test("a 200,000-character body of mixed nesting is rebuilt exactly", async () => {
  const Lines = [];
  for (let Index = 0; Lines.join("\n").length < 200_000; Index += 1) {
    const Depth = Index % 7;
    Lines.push(`${"\t".repeat(Depth)}- item ${Index} with **bold** text and a longer tail to add weight ${"x".repeat(Index % 90)}`);
  }
  const Markdown = Lines.join("\n");
  const Blocks = MarkdownToNotionBlocks(Markdown);
  const { Tree } = await CreatePage(Blocks);
  assert.deepEqual(Tree, Blocks);
  assert.equal(Serialize(NotionBlocksToDocument(Tree)), Serialize(Parse(Markdown)));
});

test("a response that reports the wrong number of created blocks stops the append", async () => {
  const Blocks = MarkdownToNotionBlocks("- a\n\t- 1\n\t\t- 2\n\t\t\t- 3");
  await assert.rejects(AppendNotionBlocks(async () => [], "page", Blocks), /reported 0 created blocks/);
});
