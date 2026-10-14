import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CanDeleteEmptyBlock,
  CanIndentBlock,
  CanOutdentBlock,
  DeleteBlock,
  GetBlockDraftText,
  GetSubtreeEnd,
  IndentBlock,
  InsertBlockAfterSubtree,
  OutdentBlock,
  SetBlockKind,
  SplitBlock,
  ToggleChecked,
  UpdateBlockContent,
  UpdateBlockExpression,
  UpdateBlockText,
} from "../Distribution/BlockOperations.js";

const Text = (Value) => [{ Type: "Text", Text: Value }];
const Paragraph = (Depth, Value) => ({ Type: "Paragraph", Depth, Content: Text(Value) });
const Bulleted = (Depth, Value) => ({ Type: "BulletedListItem", Depth, Content: Text(Value) });
const ToDo = (Depth, Value, Checked = false) => ({ Type: "ToDo", Depth, Checked, Content: Text(Value) });

test("GetBlockDraftText returns serialized inline content, raw code text, or raw expression", () => {
  assert.equal(GetBlockDraftText(Paragraph(0, "hello")), "hello");
  assert.equal(GetBlockDraftText({ Type: "Code", Depth: 0, Language: "js", Text: "const x = 1;" }), "const x = 1;");
  assert.equal(GetBlockDraftText({ Type: "Equation", Depth: 0, Expression: "x^2" }), "x^2");
  assert.equal(GetBlockDraftText({ Type: "Divider", Depth: 0 }), "");
});

test("GetSubtreeEnd finds the next sibling-or-shallower index", () => {
  const Blocks = [Bulleted(0, "Parent"), Bulleted(1, "Child"), Bulleted(1, "Child2"), Paragraph(0, "Sibling")];
  assert.equal(GetSubtreeEnd(Blocks, 0), 3);
  assert.equal(GetSubtreeEnd(Blocks, 1), 2);
  assert.equal(GetSubtreeEnd(Blocks, 3), 4);
});

test("UpdateBlockContent/Text/Expression only affect the target index and matching block kind", () => {
  const Blocks = [Paragraph(0, "a"), { Type: "Code", Depth: 0, Language: null, Text: "old" }];
  assert.equal(UpdateBlockContent(Blocks, 0, Text("b"))[0].Content[0].Text, "b");
  assert.equal(UpdateBlockText(Blocks, 1, "new")[1].Text, "new");
  assert.deepEqual(UpdateBlockText(Blocks, 0, "new")[0], Blocks[0]); // no-op: index 0 isn't Code
  assert.equal(UpdateBlockExpression([{ Type: "Equation", Depth: 0, Expression: "old" }], 0, "new")[0].Expression, "new");
});

test("ToggleChecked flips Checked only for a ToDo at the given index", () => {
  const Blocks = [ToDo(0, "a", false), Paragraph(0, "b")];
  const Next = ToggleChecked(Blocks, 0);
  assert.equal(Next[0].Checked, true);
  assert.deepEqual(Next[1], Blocks[1]);
  assert.deepEqual(ToggleChecked(Blocks, 1), Blocks); // no-op on a non-ToDo
});

test("SplitBlock keeps the same type for list-like blocks and demotes everything else to Paragraph", () => {
  const FromHeading = SplitBlock([{ Type: "Heading", Depth: 0, Level: 2, Content: Text("Title") }], 0, "Tit", "le");
  assert.equal(FromHeading.Blocks[0].Type, "Heading");
  assert.equal(FromHeading.Blocks[0].Content[0].Text, "Tit");
  assert.equal(FromHeading.Blocks[1].Type, "Paragraph");
  assert.equal(FromHeading.Blocks[1].Content[0].Text, "le");
  assert.equal(FromHeading.FocusIndex, 1);

  const FromBulleted = SplitBlock([Bulleted(0, "Item")], 0, "It", "em");
  assert.equal(FromBulleted.Blocks[1].Type, "BulletedListItem");

  const FromToDo = SplitBlock([ToDo(0, "Task", true)], 0, "Ta", "sk");
  assert.equal(FromToDo.Blocks[1].Type, "ToDo");
  assert.equal(FromToDo.Blocks[1].Checked, false); // a fresh to-do, not inheriting Checked
});

test("SplitBlock inserts the new block after the whole subtree, never reparenting existing children", () => {
  const Blocks = [Bulleted(0, "Parent"), Bulleted(1, "Child")];
  const { Blocks: Next, FocusIndex } = SplitBlock(Blocks, 0, "Parent", "New");
  assert.equal(Next.length, 3);
  assert.equal(Next[0].Content[0].Text, "Parent");
  assert.equal(Next[1].Content[0].Text, "Child"); // child stays attached to Parent
  assert.equal(Next[2].Content[0].Text, "New"); // new sibling lands after the subtree
  assert.equal(Next[2].Depth, 0);
  assert.equal(FocusIndex, 2);
});

test("CanDeleteEmptyBlock is false at index 0 and false when the block has children", () => {
  const Blocks = [Bulleted(0, "Parent"), Bulleted(1, "Child"), Paragraph(0, "Sibling")];
  assert.equal(CanDeleteEmptyBlock(Blocks, 0), false);
  assert.equal(CanDeleteEmptyBlock(Blocks, 1), true); // Child has no children of its own
  assert.equal(CanDeleteEmptyBlock(Blocks, 2), true);
});

test("DeleteBlock removes the block and focuses the previous one", () => {
  const Blocks = [Paragraph(0, "a"), Paragraph(0, "b"), Paragraph(0, "c")];
  const { Blocks: Next, FocusIndex } = DeleteBlock(Blocks, 1);
  assert.equal(Next.length, 2);
  assert.equal(Next[0].Content[0].Text, "a");
  assert.equal(Next[1].Content[0].Text, "c");
  assert.equal(FocusIndex, 0);
});

test("DeleteBlock is a no-op (FocusIndex unchanged) when the block has children", () => {
  const Blocks = [Bulleted(0, "Parent"), Bulleted(1, "Child")];
  const Result = DeleteBlock(Blocks, 0);
  assert.deepEqual(Result.Blocks, Blocks);
  assert.equal(Result.FocusIndex, 0);
});

test("Indent/Outdent: a block can only indent if the previous block is at least as deep", () => {
  const Blocks = [Paragraph(0, "a"), Paragraph(0, "b")];
  assert.equal(CanIndentBlock(Blocks, 0), false); // no previous block
  assert.equal(CanIndentBlock(Blocks, 1), true);
  assert.equal(IndentBlock(Blocks, 1)[1].Depth, 1);
});

test("IndentBlock shifts the whole subtree so children keep their relative nesting", () => {
  const Blocks = [Paragraph(0, "parent"), Bulleted(0, "item"), Bulleted(1, "child")];
  const Next = IndentBlock(Blocks, 1);
  assert.equal(Next[1].Depth, 1);
  assert.equal(Next[2].Depth, 2); // child follows its parent
  assert.equal(Next[0].Depth, 0); // unrelated sibling untouched
});

test("OutdentBlock cannot go below depth 0 and also shifts the whole subtree", () => {
  const Blocks = [Bulleted(1, "item"), Bulleted(2, "child")];
  assert.equal(CanOutdentBlock(Blocks, 0), true);
  const Next = OutdentBlock(Blocks, 0);
  assert.equal(Next[0].Depth, 0);
  assert.equal(Next[1].Depth, 1);
  assert.equal(CanOutdentBlock(Next, 0), false);
  assert.deepEqual(OutdentBlock(Next, 0), Next); // already at 0: no-op
});

test("SetBlockKind carries Content over and resets kind-specific fields", () => {
  const Blocks = [Paragraph(0, "hello")];
  assert.equal(SetBlockKind(Blocks, 0, "Heading2")[0].Level, 2);
  assert.equal(SetBlockKind(Blocks, 0, "ToDo")[0].Checked, false);
  assert.equal(SetBlockKind(Blocks, 0, "Code")[0].Text, "hello");
  assert.deepEqual(SetBlockKind(Blocks, 0, "Divider")[0], { Type: "Divider", Depth: 0 });
  assert.equal(SetBlockKind(Blocks, 0, "Callout")[0].Icon, "💡");
});

test("InsertBlockAfterSubtree lands after existing children, not between parent and children", () => {
  const Blocks = [Bulleted(0, "Parent"), Bulleted(1, "Child")];
  const { Blocks: Next, FocusIndex } = InsertBlockAfterSubtree(Blocks, 0, Paragraph(0, "New"));
  assert.equal(Next.length, 3);
  assert.equal(Next[1].Content[0].Text, "Child");
  assert.equal(Next[2].Content[0].Text, "New");
  assert.equal(FocusIndex, 2);
});
