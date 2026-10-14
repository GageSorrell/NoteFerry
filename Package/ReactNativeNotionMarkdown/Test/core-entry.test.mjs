import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const PackageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const Distribution = resolve(PackageRoot, "Distribution");
const Manifest = JSON.parse(readFileSync(resolve(PackageRoot, "package.json"), "utf8"));

/** Every module `Entry` loads, directly or transitively: built files as paths relative to `Distribution`, anything else as its bare specifier. */
function ImportGraph(Entry) {
  const Files = new Set();
  const Bare = new Set();
  const Visit = (File) => {
    if (Files.has(File)) return;
    Files.add(File);
    const Source = readFileSync(File, "utf8");
    for (const Match of Source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g)) {
      const Specifier = Match[1];
      if (Specifier.startsWith(".")) Visit(resolve(dirname(File), Specifier));
      else Bare.add(Specifier);
    }
  };
  Visit(Entry);
  return { Files: [...Files].map((File) => relative(Distribution, File).replaceAll("\\", "/")), Bare: [...Bare] };
}

test("the package manifest publishes the Core entry", () => {
  assert.deepEqual(Manifest.exports["./Core"], { import: "./Distribution/Core.js", types: "./Distribution/Core.d.ts" });
});

test("the Core entry reaches no React, React Native, component, or hook module", () => {
  const Graph = ImportGraph(resolve(Distribution, "Core.js"));

  assert.deepEqual(Graph.Bare, [], "Core has no runtime dependency outside the package");
  for (const File of Graph.Files) {
    assert.ok(!File.startsWith("Component/") && !File.startsWith("Hook/"), `${File} is UI code`);
  }
  assert.deepEqual(Graph.Files.sort(), ["Colors.js", "Core.js", "Escape.js", "NotionBridge.js", "NotionRequest.js", "Parser.js", "Serializer.js"]);
});

test("the graph check itself notices a React Native import", () => {
  const Graph = ImportGraph(resolve(Distribution, "index.js"));
  assert.ok(Graph.Bare.includes("react-native"));
  assert.ok(Graph.Bare.includes("react"));
});

test("the Core entry loads under plain Node and converts Markdown to Notion blocks and back", async () => {
  // No module hooks are registered in this file: a `react-native` import anywhere in the graph would fail here.
  const Core = await import("@noteferry/react-native-notion-markdown/Core");

  for (const Name of [
    "Parse", "Serialize", "DocumentToNotionBlocks", "NotionBlocksToDocument",
    "MarkdownToNotionBlocks", "PlainTextToNotionBlocks", "PlanPageChildren", "AppendNotionBlocks",
  ]) {
    assert.equal(typeof Core[Name], "function", Name);
  }

  const Markdown = "# Title\n- [x] **done**\n> quoted {color=\"gray\"}";
  const Document = Core.Parse(Markdown);
  const NotionBlocks = Core.DocumentToNotionBlocks(Document);
  assert.equal(NotionBlocks.length, 3);
  assert.equal(Core.Serialize(Core.NotionBlocksToDocument(NotionBlocks)), Markdown);
});
