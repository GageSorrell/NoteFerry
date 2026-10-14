import assert from "node:assert/strict";
import { test } from "node:test";
import { ApplyBlockKind, CommitDraft, EnsureEditableBlocks, FitsMaxLength, ResolveDocument, SerializedLength } from "../Distribution/EditorDocument.js";
import { Parse } from "../Distribution/Parser.js";
import { Serialize } from "../Distribution/Serializer.js";

const Blocks = (Markdown) => Parse(Markdown).Blocks;
const Markdown = (Value) => Serialize({ Blocks: Value });

test("EnsureEditableBlocks gives an empty document one empty paragraph that still serializes to nothing", () => {
  const Editable = EnsureEditableBlocks(Blocks(""));
  assert.equal(Editable.length, 1);
  assert.equal(Markdown(Editable), "");

  const Existing = Blocks("text");
  assert.equal(EnsureEditableBlocks(Existing), Existing);
});

test("CommitDraft writes inline Markdown, raw code, and raw expressions into the right field", () => {
  assert.equal(Markdown(CommitDraft(Blocks("a\nb"), 1, "**bold** b")), "a\n**bold** b");
  assert.equal(Markdown(CommitDraft(Blocks("```js\nold\n```"), 0, "x = **1**\ny")), "```js\nx = **1**\ny\n```");
  assert.equal(Markdown(CommitDraft(Blocks("$$\nold\n$$"), 0, "x^2")), "$$\nx^2\n$$");
});

test("CommitDraft leaves the document alone for an index that no longer exists", () => {
  const Source = Blocks("only");
  assert.equal(CommitDraft(Source, 5, "ghost"), Source);
});

test("ResolveDocument folds the draft in only while a block is focused", () => {
  const Source = Blocks("a\nb");
  assert.equal(ResolveDocument(Source, null, "ignored"), Source);
  assert.equal(Markdown(ResolveDocument(Source, 0, "typed")), "typed\nb");
});

test("FitsMaxLength counts the whole serialized document, including block syntax", () => {
  const Current = Blocks("abc\n- def");
  assert.equal(SerializedLength(Current), 9);
  assert.equal(FitsMaxLength(Current, CommitDraft(Current, 1, "defg"), 10), true);
  assert.equal(FitsMaxLength(Current, CommitDraft(Current, 1, "defgh"), 10), false);
  assert.equal(FitsMaxLength(Current, CommitDraft(Current, 1, "defgh"), undefined), true);
});

test("FitsMaxLength counts the escaping the serializer adds, not the raw keystrokes", () => {
  const Current = Blocks("ab");
  // A lone asterisk is literal text, which serializes escaped: two characters for one keystroke.
  const Next = CommitDraft(Current, 0, "ab*");
  assert.equal(Markdown(Next), "ab\\*");
  assert.equal(FitsMaxLength(Current, Next, 3), false);
  assert.equal(FitsMaxLength(Current, Next, 4), true);
});

test("FitsMaxLength always allows an edit that does not grow an over-long document", () => {
  const Current = Blocks("0123456789");
  assert.equal(FitsMaxLength(Current, CommitDraft(Current, 0, "012345678"), 5), true);
  assert.equal(FitsMaxLength(Current, CommitDraft(Current, 0, "0123456789"), 5), true);
  assert.equal(FitsMaxLength(Current, CommitDraft(Current, 0, "0123456789A"), 5), false);
});

test("ApplyBlockKind in set mode retypes the block and keeps the cursor on it", () => {
  const Result = ApplyBlockKind(Blocks("a\nb"), 1, "Heading2", "set");
  assert.equal(Markdown(Result.Blocks), "a\n## b");
  assert.equal(Result.FocusIndex, 1);
});

test("ApplyBlockKind in insert mode adds an empty block after the current subtree", () => {
  const Result = ApplyBlockKind(Blocks("- parent\n\t- child\nlast"), 0, "ToDo", "insert");
  assert.deepEqual(Result.Blocks.map((Block) => Block.Type), ["BulletedListItem", "BulletedListItem", "ToDo", "Paragraph"]);
  assert.equal(Result.FocusIndex, 2);
  assert.deepEqual(Result.Blocks[2].Content, []);
});

test("ApplyBlockKind turns a text block into a callout whose first child carries the text", () => {
  const Result = ApplyBlockKind(Blocks("note"), 0, "Callout", "set");
  assert.deepEqual(Result.Blocks.map((Block) => `${Block.Type}@${Block.Depth}`), ["Callout@0", "Paragraph@1"]);
  assert.equal(Result.FocusIndex, 1);
  assert.deepEqual(Parse(Markdown(Result.Blocks)).Blocks, Result.Blocks, "the result survives a serialize/parse round trip");
  assert.match(Markdown(Result.Blocks), /note/);
});

test("ApplyBlockKind follows an inserted divider with a paragraph to type in", () => {
  const Result = ApplyBlockKind(Blocks("a"), 0, "Divider", "insert");
  assert.deepEqual(Result.Blocks.map((Block) => Block.Type), ["Paragraph", "Divider", "Paragraph"]);
  assert.equal(Result.FocusIndex, 2);
});
