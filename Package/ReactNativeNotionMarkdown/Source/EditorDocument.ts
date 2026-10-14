/**
 * Pure document helpers behind `NotionMarkdownBlockEditor`'s draft handling:
 * folding the focused block's uncommitted text into the block array, and
 * enforcing a length limit against the complete serialized body. Kept
 * dependency-free (no React), like `BlockOperations.ts`, so the rules the
 * editor's `Flush()` relies on are testable without a renderer.
 */

import type { Block, InlineNode } from "./Ast.js";
import {
  InsertBlockAfterSubtree,
  IsContentBlock,
  SetBlockKind,
  UpdateBlockContent,
  UpdateBlockExpression,
  UpdateBlockText,
  type BlockKind,
  type InsertResult,
} from "./BlockOperations.js";
import { ParseInline } from "./Parser.js";
import { Serialize } from "./Serializer.js";

const EmptyParagraph: Block = { Type: "Paragraph", Depth: 0, Content: [] };

/**
 * An empty document has no block to focus, so the editor always works on at
 * least one empty paragraph. That paragraph serializes to the empty string,
 * so this never changes what an empty document emits.
 */
export function EnsureEditableBlocks(Blocks: readonly Block[]): readonly Block[] {
  return Blocks.length === 0 ? [EmptyParagraph] : Blocks;
}

/** Writes a focused block's raw draft text back into the block at `Index`. Out-of-range indexes leave the document unchanged. */
export function CommitDraft(Blocks: readonly Block[], Index: number, Text: string): readonly Block[] {
  const Node = Blocks[Index];
  if (Node === undefined) return Blocks;
  if (Node.Type === "Code") return UpdateBlockText(Blocks, Index, Text);
  if (Node.Type === "Equation") return UpdateBlockExpression(Blocks, Index, Text);
  return UpdateBlockContent(Blocks, Index, ParseInline(Text));
}

/** The document as the user currently sees it: the committed blocks plus the focused block's uncommitted draft, if any. */
export function ResolveDocument(Blocks: readonly Block[], FocusedIndex: number | null, Draft: string): readonly Block[] {
  return FocusedIndex === null ? Blocks : CommitDraft(Blocks, FocusedIndex, Draft);
}

export function SerializedLength(Blocks: readonly Block[]): number {
  return Serialize({ Blocks }).length;
}

/**
 * Whether an edit from `Current` to `Next` respects `MaxLength`, measured on
 * the complete serialized Markdown rather than on any one block's text. An
 * edit that does not grow the document is always allowed, so a body that
 * already exceeds the limit can still be trimmed back under it.
 */
export function FitsMaxLength(Current: readonly Block[], Next: readonly Block[], MaxLength: number | undefined): boolean {
  if (MaxLength === undefined) return true;
  const NextLength = SerializedLength(Next);
  return NextLength <= MaxLength || NextLength <= SerializedLength(Current);
}

function EmptyBlockLike(Node: Block): Block {
  switch (Node.Type) {
    case "Code":
      return { ...Node, Text: "" };
    case "Equation":
      return { ...Node, Expression: "" };
    case "Divider":
    case "Callout":
      return Node;
    case "ToDo":
      return { ...Node, Checked: false, Content: [] };
    default:
      return { ...Node, Content: [] };
  }
}

/**
 * A divider and a callout have no text of their own, so neither can hold the
 * cursor. Whenever a picker action lands on one, this adds the paragraph the
 * user goes on typing in — the callout's first child, or the block after the
 * divider — carrying over any text the retyped block had.
 */
function WithEditableTarget(Blocks: readonly Block[], Index: number, Carried: readonly InlineNode[]): InsertResult {
  const Node = Blocks[Index]!;
  if (Node.Type !== "Callout" && Node.Type !== "Divider") return { Blocks, FocusIndex: Index };
  const Depth = Node.Type === "Callout" ? Node.Depth + 1 : Node.Depth;
  const Paragraph: Block = { Type: "Paragraph", Depth, Content: Carried };
  return { Blocks: [...Blocks.slice(0, Index + 1), Paragraph, ...Blocks.slice(Index + 1)], FocusIndex: Index + 1 };
}

/**
 * Applies a block-type picker choice: `"set"` retypes the block at `Index`,
 * `"insert"` adds an empty block of that kind after its subtree. Returns the
 * index that should take the cursor, which is always an editable block.
 */
export function ApplyBlockKind(Blocks: readonly Block[], Index: number, Kind: BlockKind, Mode: "set" | "insert"): InsertResult {
  if (Mode === "insert") {
    const Prototype = SetBlockKind(Blocks, Index, Kind)[Index]!;
    const Inserted = InsertBlockAfterSubtree(Blocks, Index, EmptyBlockLike(Prototype));
    return WithEditableTarget(Inserted.Blocks, Inserted.FocusIndex, []);
  }
  const Source = Blocks[Index]!;
  return WithEditableTarget(SetBlockKind(Blocks, Index, Kind), Index, IsContentBlock(Source) ? Source.Content : []);
}
