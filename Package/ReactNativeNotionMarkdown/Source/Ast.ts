/**
 * Abstract syntax tree for the subset of Notion's Enhanced Markdown format
 * implemented by this package.
 *
 * https://developers.notion.com/guides/data-apis/enhanced-markdown
 *
 * Milestone 1 covered the plain CommonMark-compatible constructs: paragraphs,
 * headings, lists, to-dos, quotes, code, dividers, and inline bold/italic/
 * strikethrough/code/link. Milestone 2 (this revision) adds Notion-specific
 * constructs: callouts, toggles, block/inline color, underline, equations,
 * and render-only mentions.
 */

import type { ColorValue } from "./Colors.js";

/** Notion headings go up to level 4 (one deeper than the classic Blocks API's H1-3). */
export type HeadingLevel = 1 | 2 | 3 | 4;

/**
 * A mention is render-only: this package never authors a real Notion mention
 * from typed text, it only renders one that already came from Notion.
 * `user`/`page`/`database` mentions carry whatever identifying `Url` the
 * source gave them (the Enhanced Markdown format's own `url="..."` attribute,
 * not necessarily literally Notion's internal object id); `date` mentions
 * carry an ISO date range instead.
 */
export type MentionNode =
  | { readonly MentionKind: "user" | "page" | "database"; readonly Url: string; readonly DisplayText: string }
  | { readonly MentionKind: "date"; readonly Start: string; readonly End: string | null };

/** A single inline formatting node within a block's rich text. */
export type InlineNode =
  | { readonly Type: "Text"; readonly Text: string }
  | { readonly Type: "Bold"; readonly Children: readonly InlineNode[] }
  | { readonly Type: "Italic"; readonly Children: readonly InlineNode[] }
  | { readonly Type: "Strikethrough"; readonly Children: readonly InlineNode[] }
  | { readonly Type: "Underline"; readonly Children: readonly InlineNode[] }
  | { readonly Type: "Code"; readonly Text: string }
  | { readonly Type: "Link"; readonly Url: string; readonly Children: readonly InlineNode[] }
  | { readonly Type: "Color"; readonly Color: ColorValue; readonly Children: readonly InlineNode[] }
  | { readonly Type: "Equation"; readonly Expression: string }
  | { readonly Type: "LineBreak" }
  | ({ readonly Type: "Mention" } & MentionNode);

/**
 * A top-level block in a Notion Enhanced Markdown document. `Depth` is the
 * block's indentation level (0 = top-level), which Notion's format encodes
 * as literal leading tabs — a child block is exactly one tab deeper than
 * its parent. Nesting is therefore flat-with-depth rather than a tree: list
 * items, toggle children, and callout body content are all plain sibling
 * entries in `Document.Blocks` whose relative `Depth` expresses the
 * hierarchy — the same mechanism serves every container block, not just
 * lists.
 *
 * `Color` is the optional trailing block-level attribute (`{color="..."}`)
 * supported on the plain content blocks. Callout and Toggle carry color as
 * part of their own opening tag instead, per the format's tag-based syntax.
 * Code, Divider, and Equation blocks have no documented color attribute.
 *
 * Callout has no `Content` field of its own: per Notion's documented
 * example, a callout's opening tag carries no inline text — its displayed
 * body is whatever ordinary blocks appear at `Depth + 1` beneath it (the
 * first of which is typically a Paragraph). Toggle, in contrast, has its
 * own `Content` (the clickable `<summary>` title), with further child
 * blocks likewise following at `Depth + 1`.
 */
export type Block =
  | { readonly Type: "Paragraph"; readonly Depth: number; readonly Color?: ColorValue; readonly Content: readonly InlineNode[] }
  | { readonly Type: "Heading"; readonly Depth: number; readonly Level: HeadingLevel; readonly Color?: ColorValue; readonly Content: readonly InlineNode[] }
  | { readonly Type: "BulletedListItem"; readonly Depth: number; readonly Color?: ColorValue; readonly Content: readonly InlineNode[] }
  | { readonly Type: "NumberedListItem"; readonly Depth: number; readonly Color?: ColorValue; readonly Content: readonly InlineNode[] }
  | { readonly Type: "ToDo"; readonly Depth: number; readonly Checked: boolean; readonly Color?: ColorValue; readonly Content: readonly InlineNode[] }
  | { readonly Type: "Quote"; readonly Depth: number; readonly Color?: ColorValue; readonly Content: readonly InlineNode[] }
  | { readonly Type: "Code"; readonly Depth: number; readonly Language: string | null; readonly Text: string }
  | { readonly Type: "Divider"; readonly Depth: number }
  | { readonly Type: "Callout"; readonly Depth: number; readonly Icon: string | null; readonly Color?: ColorValue }
  | { readonly Type: "Toggle"; readonly Depth: number; readonly Color?: ColorValue; readonly Content: readonly InlineNode[] }
  | { readonly Type: "Equation"; readonly Depth: number; readonly Expression: string };

export type BlockType = Block["Type"];

export interface Document {
  readonly Blocks: readonly Block[];
}
