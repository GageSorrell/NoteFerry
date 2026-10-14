/**
 * Workspace-only tests for `_shared/PageBody.ts`, run under Node (which
 * strips the TypeScript types on import) — like the rest of `_typecheck`,
 * nothing here is deployed. Run with `npm run check:functions`.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { build } from "esbuild";
import { MarkdownToNotionBlocks as LegacyMarkdownToNotionBlocks } from "@noteferry/notion-markdown";
import { MarkdownToNotionBlocks, PlainTextToNotionBlocks } from "@noteferry/react-native-notion-markdown/Core";
import { MaxBodyLength, PlanPageBody, RichBodyFeature, WithRateLimitRetry } from "../_shared/PageBody.ts";

const Text = (Block) => Block[Block.type].rich_text.map((Item) => Item.text.content).join("");

/** Runs a plan against a recording stand-in for Notion and returns every request it made. */
async function Send(Result) {
  assert.equal(Result._tag, "Planned");
  const Appends = [];
  let NextId = 0;
  await Result.Plan.AppendRemaining("page", async (ParentId, Children) => {
    Appends.push({ ParentId, Children });
    return Children.map(() => `block-${(NextId += 1)}`);
  });
  return { Initial: Result.Plan.Initial, Appends };
}

// --- The Pro gate ----------------------------------------------------------

test("a rich body from an account without Pro is refused, whatever it contains", () => {
  assert.deepEqual(PlanPageBody("# Title", "NotionMarkdown", false), { _tag: "Gated" });
  assert.deepEqual(PlanPageBody("plain words", "NotionMarkdown", false), { _tag: "Gated" });
  assert.deepEqual(PlanPageBody("", "NotionMarkdown", false), { _tag: "Gated" });
  assert.deepEqual(PlanPageBody(undefined, "NotionMarkdown", false), { _tag: "Gated" });
  assert.equal(RichBodyFeature, "RichEditor");
});

test("plain text is available without Pro, and with it", async () => {
  for (const IsPro of [false, true]) {
    const { Initial, Appends } = await Send(PlanPageBody("# literal", "PlainText", IsPro));
    assert.deepEqual(Initial, PlainTextToNotionBlocks("# literal"));
    assert.deepEqual(Appends, []);
  }
});

test("a rich body with Pro is converted by the editor's own core", async () => {
  const Markdown = "# Title\n- [x] done\n<callout icon=\"💡\">\n\tNote\n</callout>";
  const { Initial, Appends } = await Send(PlanPageBody(Markdown, "NotionMarkdown", true));
  assert.deepEqual(Initial, MarkdownToNotionBlocks(Markdown));
  assert.deepEqual(Initial.map((Block) => Block.type), ["heading_1", "to_do", "callout"]);
  assert.deepEqual(Appends, []);
});

// --- Formats ---------------------------------------------------------------

test("plain text is never interpreted, where the same body sent as rich text is", () => {
  const Body = "# Heading\n- [ ] task\n**bold**";
  const Plain = PlanPageBody(Body, "PlainText", true).Plan.Initial;
  const Rich = PlanPageBody(Body, "NotionMarkdown", true).Plan.Initial;

  assert.deepEqual(Plain.map((Block) => Block.type), ["paragraph", "paragraph", "paragraph"]);
  assert.deepEqual(Plain.map(Text), ["# Heading", "- [ ] task", "**bold**"]);
  assert.deepEqual(Rich.map((Block) => Block.type), ["heading_1", "to_do", "paragraph"]);
});

test("a command without a format keeps the conversion older clients were built against", async () => {
  const Body = "# Title\n\nSome **bold** text.\n\n- one\n- two";
  for (const IsPro of [false, true]) {
    const { Initial, Appends } = await Send(PlanPageBody(Body, undefined, IsPro));
    assert.deepEqual(Initial, LegacyMarkdownToNotionBlocks(Body, { FailOnUnsupported: true }).Blocks);
    assert.deepEqual(Appends, []);
  }
});

test("a legacy body beyond 100 blocks is still appended to the page in 100-block chunks", async () => {
  const Body = Array.from({ length: 250 }, (_, Index) => `Paragraph ${Index}`).join("\n\n");
  const All = LegacyMarkdownToNotionBlocks(Body, { FailOnUnsupported: true }).Blocks;
  assert.equal(All.length, 250);

  const { Initial, Appends } = await Send(PlanPageBody(Body, undefined, false));
  assert.deepEqual(Initial, All.slice(0, 100));
  assert.deepEqual(Appends, [
    { ParentId: "page", Children: All.slice(100, 200) },
    { ParentId: "page", Children: All.slice(200) },
  ]);
});

test("an empty or missing body creates a blank page in every permitted format", async () => {
  for (const [Body, Format, IsPro] of [["", "PlainText", false], ["  \n ", "PlainText", false], [undefined, "PlainText", false], ["", "NotionMarkdown", true], [undefined, undefined, false], ["", undefined, false]]) {
    const { Initial, Appends } = await Send(PlanPageBody(Body, Format, IsPro));
    assert.deepEqual(Initial, []);
    assert.deepEqual(Appends, []);
  }
});

test("a body longer than the clients allow is refused in the new formats", () => {
  const AtLimit = "a".repeat(MaxBodyLength);
  assert.equal(PlanPageBody(AtLimit, "PlainText", false)._tag, "Planned");
  assert.equal(PlanPageBody(`${AtLimit}a`, "PlainText", false)._tag, "TooLong");
  assert.equal(PlanPageBody(`${AtLimit}a`, "NotionMarkdown", true)._tag, "TooLong");
  assert.equal(PlanPageBody(`${AtLimit}a`, "NotionMarkdown", false)._tag, "Gated", "the gate is checked first");
});

// --- Appends ---------------------------------------------------------------

test("children nested deeper than one request allows are appended beneath the blocks Notion reports", async () => {
  const Markdown = "intro\n- a\n\t- a.1\n\t\t- a.1.1\n\t\t\t- a.1.1.1\n- b";
  const { Initial, Appends } = await Send(PlanPageBody(Markdown, "NotionMarkdown", true));

  assert.deepEqual(Initial.map(Text), ["intro"]);
  assert.deepEqual(Appends.map((Request) => [Request.ParentId, Request.Children.map(Text)]), [
    ["page", ["a", "b"]],
    ["block-1", ["a.1"]],
  ]);
  // "a" went bare so its id could be used; "a.1" then carried its two remaining levels in one request.
  assert.equal("children" in Appends[0].Children[0].bulleted_list_item, false);
  assert.equal(Text(Appends[1].Children[0].bulleted_list_item.children[0].bulleted_list_item.children[0]), "a.1.1.1");
});

test("a long plain-text body is appended in order after the page is created", async () => {
  const Lines = Array.from({ length: 320 }, (_, Index) => `line ${Index}`);
  const { Initial, Appends } = await Send(PlanPageBody(Lines.join("\n"), "PlainText", false));
  assert.deepEqual([...Initial, ...Appends.flatMap((Request) => Request.Children)].map(Text), Lines);
  assert.deepEqual(Appends.map((Request) => Request.ParentId), ["page", "page", "page"]);
});

// --- Rate limiting ---------------------------------------------------------

test("a rate-limited append waits for Notion's Retry-After and then succeeds", async () => {
  const Waits = [];
  let Calls = 0;
  const Append = WithRateLimitRetry(
    async () => {
      Calls += 1;
      if (Calls < 3) throw Object.assign(new Error("rate limited"), { Status: 429, RetryAfterSeconds: Calls === 1 ? 2 : undefined });
      return ["id"];
    },
    async (Milliseconds) => { Waits.push(Milliseconds); },
  );

  assert.deepEqual(await Append("page", [{}]), ["id"]);
  assert.equal(Calls, 3);
  assert.deepEqual(Waits, [2000, 1000]);
});

test("a persistent rate limit, or any other failure, is not retried forever", async () => {
  let Calls = 0;
  const Limited = WithRateLimitRetry(async () => { Calls += 1; throw Object.assign(new Error("rate limited"), { Status: 429 }); }, async () => { }, 3);
  await assert.rejects(Limited("page", [{}]), /rate limited/);
  assert.equal(Calls, 4);

  Calls = 0;
  const Invalid = WithRateLimitRetry(async () => { Calls += 1; throw Object.assign(new Error("bad request"), { Status: 400 }); }, async () => { });
  await assert.rejects(Invalid("page", [{}]), /bad request/);
  assert.equal(Calls, 1);
});

// --- The vendored bundle ---------------------------------------------------

test("the vendored editor core is the bundle the package currently builds", async () => {
  const Vendored = new URL("../_shared/vendor/notion-markdown-core.js", import.meta.url);
  const Entry = new URL("../../../Package/ReactNativeNotionMarkdown/Distribution/Core.js", import.meta.url);
  const { outputFiles: [Built] } = await build({
    bundle: true,
    entryPoints: [Entry.pathname.replace(/^\/([A-Za-z]:)/, "$1")],
    format: "esm",
    platform: "neutral",
    write: false,
  });
  const Normalize = (Source) => Source.replace(/\r\n/g, "\n").replace(/^\/\/ .*$/gm, "");
  assert.equal(
    Normalize(readFileSync(Vendored, "utf8")),
    Normalize(Built.text),
    "supabase/functions/_shared/vendor/notion-markdown-core.js is stale — regenerate it (see vendor/README.md)",
  );
});
