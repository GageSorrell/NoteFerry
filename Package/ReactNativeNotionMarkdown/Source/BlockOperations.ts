/**
 * Pure block-array operations for `NotionMarkdownBlockEditor`: split/merge/
 * indent/outdent/retype, all operating on the same flat, Depth-tagged
 * `Block[]` `Ast.ts` already uses. Kept dependency-free (no React) so it's
 * testable the same way as `Parser.ts`/`Serializer.ts`.
 */

import type { Block, BlockType, HeadingLevel, InlineNode } from "./Ast.js";
import { ParseInline } from "./Parser.js";
import { SerializeInline } from "./Serializer.js";

/** Block types that continue as themselves when split by Enter; every other type becomes a new Paragraph, matching common block-editor convention. */
const ListLikeTypes: ReadonlySet<BlockType> = new Set(["BulletedListItem", "NumberedListItem", "ToDo"]);

type ContentBlock = Extract<Block, { Content: readonly InlineNode[] }>;

/** Whether a block carries editable rich-text `Content` (unlike Code's raw `Text`, Equation's raw `Expression`, or Divider/Callout, which have neither). */
export function IsContentBlock(Node: Block): Node is ContentBlock {
  return "Content" in Node;
}

/** The raw, single-line Enhanced Markdown source for a block's own editable text — not its children. */
export function GetBlockDraftText(Node: Block): string {
  if (IsContentBlock(Node)) return SerializeInline(Node.Content);
  if (Node.Type === "Code") return Node.Text;
  if (Node.Type === "Equation") return Node.Expression;
  return "";
}

/** The index just past `Index`'s entire subtree (itself plus every block deeper than it) — its next sibling-or-shallower position. */
export function GetSubtreeEnd(Blocks: readonly Block[], Index: number): number {
  const Depth = Blocks[Index]!.Depth;
  let End = Index + 1;
  while (End < Blocks.length && Blocks[End]!.Depth > Depth) End += 1;
  return End;
}

export function UpdateBlockContent(Blocks: readonly Block[], Index: number, Content: readonly InlineNode[]): readonly Block[] {
  return Blocks.map((Node, NodeIndex) => (NodeIndex === Index && IsContentBlock(Node) ? { ...Node, Content } : Node));
}

export function UpdateBlockText(Blocks: readonly Block[], Index: number, Text: string): readonly Block[] {
  return Blocks.map((Node, NodeIndex) => (NodeIndex === Index && Node.Type === "Code" ? { ...Node, Text } : Node));
}

export function UpdateBlockExpression(Blocks: readonly Block[], Index: number, Expression: string): readonly Block[] {
  return Blocks.map((Node, NodeIndex) => (NodeIndex === Index && Node.Type === "Equation" ? { ...Node, Expression } : Node));
}

export function ToggleChecked(Blocks: readonly Block[], Index: number): readonly Block[] {
  return Blocks.map((Node, NodeIndex) => (NodeIndex === Index && Node.Type === "ToDo" ? { ...Node, Checked: !Node.Checked } : Node));
}

export interface SplitResult {
  readonly Blocks: readonly Block[];
  readonly FocusIndex: number;
}

/**
 * Splits the block at `Index` at the cursor: it keeps `TextBefore` as its
 * own content, and a new block holding `TextAfter` is inserted after the
 * *entire* subtree (not immediately after `Index`) — so a block that
 * already has children never has them reparented onto the new block.
 */
export function SplitBlock(Blocks: readonly Block[], Index: number, TextBefore: string, TextAfter: string): SplitResult {
  const Current = Blocks[Index]!;
  const Updated = UpdateBlockContent(Blocks, Index, ParseInline(TextBefore));
  const InsertAt = GetSubtreeEnd(Updated, Index);

  const Content = ParseInline(TextAfter);
  const NewType: BlockType = ListLikeTypes.has(Current.Type) ? Current.Type : "Paragraph";
  let NewBlock: Block;
  switch (NewType) {
    case "ToDo":
      NewBlock = { Type: "ToDo", Depth: Current.Depth, Checked: false, Content };
      break;
    case "BulletedListItem":
      NewBlock = { Type: "BulletedListItem", Depth: Current.Depth, Content };
      break;
    case "NumberedListItem":
      NewBlock = { Type: "NumberedListItem", Depth: Current.Depth, Content };
      break;
    default:
      NewBlock = { Type: "Paragraph", Depth: Current.Depth, Content };
  }

  return { Blocks: [...Updated.slice(0, InsertAt), NewBlock, ...Updated.slice(InsertAt)], FocusIndex: InsertAt };
}

export interface DeleteResult {
  readonly Blocks: readonly Block[];
  readonly FocusIndex: number | null;
}

/** Whether backspace-at-start should delete this (empty) block: only when it has no children of its own, so a subtree's depth context is never orphaned. */
export function CanDeleteEmptyBlock(Blocks: readonly Block[], Index: number): boolean {
  if (Index <= 0) return false;
  const Next = Blocks[Index + 1];
  return Next === undefined || Next.Depth <= Blocks[Index]!.Depth;
}

export function DeleteBlock(Blocks: readonly Block[], Index: number): DeleteResult {
  if (!CanDeleteEmptyBlock(Blocks, Index)) return { Blocks, FocusIndex: Index };
  return { Blocks: [...Blocks.slice(0, Index), ...Blocks.slice(Index + 1)], FocusIndex: Index - 1 };
}

/** A block can indent one level only if the preceding block is already at least as deep — it becomes the new parent. */
export function CanIndentBlock(Blocks: readonly Block[], Index: number): boolean {
  return Index > 0 && Blocks[Index - 1]!.Depth >= Blocks[Index]!.Depth;
}

export function CanOutdentBlock(Blocks: readonly Block[], Index: number): boolean {
  return Blocks[Index]!.Depth > 0;
}

function ShiftSubtreeDepth(Blocks: readonly Block[], Index: number, Delta: number): readonly Block[] {
  const End = GetSubtreeEnd(Blocks, Index);
  return Blocks.map((Node, NodeIndex) => (NodeIndex >= Index && NodeIndex < End ? { ...Node, Depth: Math.max(0, Node.Depth + Delta) } : Node));
}

/** Indents `Index` and its whole subtree by one level, so existing children keep their relative nesting. */
export function IndentBlock(Blocks: readonly Block[], Index: number): readonly Block[] {
  return CanIndentBlock(Blocks, Index) ? ShiftSubtreeDepth(Blocks, Index, 1) : Blocks;
}

export function OutdentBlock(Blocks: readonly Block[], Index: number): readonly Block[] {
  return CanOutdentBlock(Blocks, Index) ? ShiftSubtreeDepth(Blocks, Index, -1) : Blocks;
}

/** The block "kinds" the slash-command / block-type picker offers — headings split out by level, unlike `BlockType`. */
export type BlockKind =
  | "Paragraph"
  | "Heading1"
  | "Heading2"
  | "Heading3"
  | "Heading4"
  | "BulletedListItem"
  | "NumberedListItem"
  | "ToDo"
  | "Quote"
  | "Code"
  | "Divider"
  | "Callout"
  | "Toggle"
  | "Equation";

export const BlockKinds: readonly BlockKind[] = [
  "Paragraph", "Heading1", "Heading2", "Heading3", "Heading4",
  "BulletedListItem", "NumberedListItem", "ToDo", "Quote",
  "Code", "Divider", "Callout", "Toggle", "Equation",
];

const HeadingLevelByKind: Partial<Record<BlockKind, HeadingLevel>> = {
  Heading1: 1, Heading2: 2, Heading3: 3, Heading4: 4,
};

/** Converts the block at `Index` to a different kind via the picker, carrying over rich-text `Content` where the new kind also has one. */
export function SetBlockKind(Blocks: readonly Block[], Index: number, Kind: BlockKind): readonly Block[] {
  const Current = Blocks[Index]!;
  const Content = IsContentBlock(Current) ? Current.Content : [];
  const Depth = Current.Depth;

  let NewBlock: Block;
  switch (Kind) {
    case "Heading1":
    case "Heading2":
    case "Heading3":
    case "Heading4":
      NewBlock = { Type: "Heading", Depth, Level: HeadingLevelByKind[Kind]!, Content };
      break;
    case "BulletedListItem":
      NewBlock = { Type: "BulletedListItem", Depth, Content };
      break;
    case "NumberedListItem":
      NewBlock = { Type: "NumberedListItem", Depth, Content };
      break;
    case "ToDo":
      NewBlock = { Type: "ToDo", Depth, Checked: false, Content };
      break;
    case "Quote":
      NewBlock = { Type: "Quote", Depth, Content };
      break;
    case "Code":
      NewBlock = { Type: "Code", Depth, Language: null, Text: SerializeInline(Content) };
      break;
    case "Divider":
      NewBlock = { Type: "Divider", Depth };
      break;
    case "Callout":
      NewBlock = { Type: "Callout", Depth, Icon: "💡" };
      break;
    case "Toggle":
      NewBlock = { Type: "Toggle", Depth, Content };
      break;
    case "Equation":
      NewBlock = { Type: "Equation", Depth, Expression: SerializeInline(Content) };
      break;
    default:
      NewBlock = { Type: "Paragraph", Depth, Content };
  }

  return Blocks.map((Node, NodeIndex) => (NodeIndex === Index ? NewBlock : Node));
}

export interface InsertResult {
  readonly Blocks: readonly Block[];
  readonly FocusIndex: number;
}

/** Inserts `NewBlock` immediately after `Index`'s entire subtree, e.g. for a picker action that adds a block below rather than retyping the current one. */
export function InsertBlockAfterSubtree(Blocks: readonly Block[], Index: number, NewBlock: Block): InsertResult {
  const InsertAt = GetSubtreeEnd(Blocks, Index);
  return { Blocks: [...Blocks.slice(0, InsertAt), NewBlock, ...Blocks.slice(InsertAt)], FocusIndex: InsertAt };
}
