/**
 * Fits a Notion block tree into requests Notion accepts, and turns the two
 * body formats a client can send into that tree.
 *
 * `NotionBridge.ts` already applies every per-value limit (text length, items
 * per rich-text array). What remains is per request, and Notion enforces all
 * of it together:
 *
 * - 100 blocks in any one `children` array;
 * - two levels of nesting below the blocks a request lists;
 * - 1,000 blocks in a request altogether;
 * - 500KB of payload.
 *
 * A tree that exceeds any of these has to be sent in pieces, and a piece
 * nested under a block can only be sent once that block exists and its id is
 * known — which Notion reports only for the blocks a request lists directly,
 * not for their descendants. So a block is sent together with its subtree
 * only when the *whole* subtree fits; otherwise it is sent bare, and its
 * children are appended to it afterwards under the same rules.
 *
 * https://developers.notion.com/reference/request-limits
 * https://developers.notion.com/reference/patch-block-children
 */

import {
  ChunkText,
  DocumentToNotionBlocks,
  GetNotionBlockChildren,
  MaxBlockChildren,
  MaxBlockTextLength,
  MaxRichTextItems,
  MaxRichTextLength,
  WithNotionBlockChildren,
  type NotionBlock,
  type NotionRichTextItem,
} from "./NotionBridge.js";
import { Parse } from "./Parser.js";

/** Blocks, at every level, in one request. */
export const MaxRequestBlocks = 1000;
/** Levels of `children` below the blocks a request lists. */
export const MaxNestingLevels = 2;
/**
 * Bytes of block JSON this module puts in one request. Notion's ceiling is
 * 500KB for the whole payload; the margin leaves room for what travels with
 * the blocks — on page creation, the page's properties, icon, and cover.
 */
export const MaxRequestBytes = 300_000;

// --- Body formats ---

/** Converts an Enhanced Markdown body, as the block editor serializes it, into Notion request blocks. */
export function MarkdownToNotionBlocks(Markdown: string): NotionBlock[] {
  return DocumentToNotionBlocks(Parse(Markdown));
}

/**
 * Converts a plain-text body into paragraphs that show exactly what was
 * typed: nothing is parsed, so `# heading`, `- [ ] task`, and `**bold**`
 * arrive as those characters. Each line becomes a paragraph, and a blank
 * line an empty paragraph, so the spacing of the text survives too; only
 * trailing blank lines are dropped.
 */
export function PlainTextToNotionBlocks(Text: string): NotionBlock[] {
  const Lines = Text.replace(/\r\n?/g, "\n").split("\n");
  while (Lines.length > 0 && Lines[Lines.length - 1]!.trim() === "") Lines.pop();

  const Blocks: NotionBlock[] = [];
  for (const Line of Lines) {
    const Items: NotionRichTextItem[] = ChunkText(Line, MaxRichTextLength).map((Content) => ({ type: "text", text: { content: Content, link: null } }));
    // A single line beyond what one block may carry continues in the next paragraph.
    const PerBlock = Math.min(MaxRichTextItems, Math.floor(MaxBlockTextLength / MaxRichTextLength));
    for (let Start = 0; Start < Math.max(Items.length, 1); Start += PerBlock) {
      Blocks.push({ type: "paragraph", paragraph: { rich_text: Items.slice(Start, Start + PerBlock) } });
    }
  }
  return Blocks;
}

// --- Request planning ---

/** The UTF-8 size of a string, counted without allocating the encoded bytes. */
function Utf8Length(Text: string): number {
  let Bytes = 0;
  for (let Index = 0; Index < Text.length; Index += 1) {
    const Code = Text.charCodeAt(Index);
    if (Code < 0x80) Bytes += 1;
    else if (Code < 0x800) Bytes += 2;
    else if (Code >= 0xd800 && Code <= 0xdbff) {
      Bytes += 4;
      Index += 1;
    } else Bytes += 3;
  }
  return Bytes;
}

interface Measure {
  /** Blocks in the subtree, the root included. */
  readonly Count: number;
  /** Levels of children below the root. */
  readonly Levels: number;
  /** The largest `children` array anywhere in the subtree. */
  readonly Widest: number;
}

function MeasureBlock(Node: NotionBlock): Measure {
  const Children = GetNotionBlockChildren(Node);
  let Count = 1;
  let Levels = 0;
  let Widest = Children.length;
  for (const Child of Children) {
    const Inner = MeasureBlock(Child);
    Count += Inner.Count;
    Levels = Math.max(Levels, Inner.Levels + 1);
    Widest = Math.max(Widest, Inner.Widest);
  }
  return { Count, Levels, Widest };
}

const BlockBytes = (Node: NotionBlock): number => Utf8Length(JSON.stringify(Node));

interface Piece {
  /** The block as it is sent: whole, or stripped of its children. */
  readonly Block: NotionBlock;
  /** Children to append once the block exists; empty when it was sent whole. */
  readonly Deferred: readonly NotionBlock[];
  readonly Count: number;
  readonly Bytes: number;
}

/** Decides whether a block travels with its whole subtree or bare. */
function ToPiece(Node: NotionBlock): Piece {
  const Children = GetNotionBlockChildren(Node);
  if (Children.length === 0) return { Block: Node, Deferred: [], Count: 1, Bytes: BlockBytes(Node) };

  const Size = MeasureBlock(Node);
  const Bytes = BlockBytes(Node);
  const Whole = Size.Levels <= MaxNestingLevels && Size.Widest <= MaxBlockChildren && Size.Count <= MaxRequestBlocks && Bytes <= MaxRequestBytes;
  if (Whole) return { Block: Node, Deferred: [], Count: Size.Count, Bytes };

  const Bare = WithNotionBlockChildren(Node, []);
  return { Block: Bare, Deferred: Children, Count: 1, Bytes: BlockBytes(Bare) };
}

/** Packs sibling blocks, in order, into the fewest requests that respect every per-request limit. */
function ToBatches(Blocks: readonly NotionBlock[]): Piece[][] {
  const Batches: Piece[][] = [];
  let Current: Piece[] = [];
  let Count = 0;
  let Bytes = 0;
  for (const Node of Blocks) {
    const Next = ToPiece(Node);
    const Full = Current.length >= MaxBlockChildren || Count + Next.Count > MaxRequestBlocks || Bytes + Next.Bytes > MaxRequestBytes;
    if (Current.length > 0 && Full) {
      Batches.push(Current);
      Current = [];
      Count = 0;
      Bytes = 0;
    }
    Current.push(Next);
    Count += Next.Count;
    Bytes += Next.Bytes;
  }
  if (Current.length > 0) Batches.push(Current);
  return Batches;
}

export interface PageChildrenPlan {
  /** Blocks to include in the Create Page request itself. */
  readonly Initial: NotionBlock[];
  /** Blocks to append to the new page afterwards, with `AppendNotionBlocks`. */
  readonly Remaining: NotionBlock[];
}

/**
 * Splits a page body between the Create Page request and the appends that
 * follow it. Creating a page does not report the ids of the blocks it
 * creates, so nothing could be appended beneath them later: `Initial` is
 * therefore the leading run of blocks that are complete as sent, and it stops
 * at the first block whose children must be appended separately.
 */
export function PlanPageChildren(Blocks: readonly NotionBlock[]): PageChildrenPlan {
  const [First] = ToBatches(Blocks);
  if (First === undefined) return { Initial: [], Remaining: [] };
  const Incomplete = First.findIndex((Item) => Item.Deferred.length > 0);
  const Taken = Incomplete === -1 ? First.length : Incomplete;
  return { Initial: Blocks.slice(0, Taken), Remaining: Blocks.slice(Taken) };
}

/**
 * Sends one request appending `Children` to `ParentId` (a page or a block)
 * and resolves to the ids of the blocks it created, in the order given.
 */
export type NotionAppend = (ParentId: string, Children: NotionBlock[]) => Promise<readonly string[]>;

/**
 * Appends a block tree of any size beneath `ParentId`, in document order.
 * Siblings go out in order, one request at a time, so their order under the
 * parent is the order of `Blocks`; a block sent without its children gets
 * them appended, recursively, before the next batch of its siblings is sent.
 */
export async function AppendNotionBlocks(Append: NotionAppend, ParentId: string, Blocks: readonly NotionBlock[]): Promise<void> {
  for (const Batch of ToBatches(Blocks)) {
    const Ids = await Append(ParentId, Batch.map((Item) => Item.Block));
    if (Ids.length !== Batch.length) {
      throw new Error(`Notion reported ${Ids.length} created blocks for a request that appended ${Batch.length}.`);
    }
    for (let Index = 0; Index < Batch.length; Index += 1) {
      const { Deferred } = Batch[Index]!;
      if (Deferred.length > 0) await AppendNotionBlocks(Append, Ids[Index]!, Deferred);
    }
  }
}
