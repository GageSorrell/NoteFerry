/**
 * Bridges this package's AST to and from Notion's real block/rich-text API
 * shapes. `DocumentToNotionBlocks` emits request objects Notion accepts as
 * written: nested blocks sit inside their parent's type object, and every
 * per-value size limit is applied here (see the `Max…` constants). Limits on
 * a whole request — how many blocks, how deep, how many bytes — are
 * `NotionRequest.ts`'s concern.
 *
 * https://developers.notion.com/reference/block
 * https://developers.notion.com/reference/request-limits
 *
 * `NotionBlock`/`NotionRichTextItem` below are this package's OWN local
 * types, not `@notionhq/client`'s `BlockObjectRequest`/`BlockObjectResponse`.
 * That SDK does not publicly export its granular request types
 * (`RichTextItemRequest`, `PageIconRequest`, ...), and its exported
 * `BlockObjectRequest` caps how deep its generated `children` typing
 * recurses — a real limit on the TYPE, not the API — while our source AST
 * has no such cap. `ApiColor` (the one granular type the SDK does export)
 * is used directly, so color values are checked against Notion's real enum.
 * The shapes below are structurally compatible with the real API; adapt at
 * the call site if a literal `BlockObjectRequest`/`BlockObjectResponse` is
 * required.
 */

import type { ApiColor } from "@notionhq/client";
import type { Block, Document, InlineNode } from "./Ast.js";
import { IsColorValue, type ColorValue } from "./Colors.js";

/** Characters in one rich-text item's `text.content`. */
export const MaxRichTextLength = 2000;
/** Blocks in one `children` array. */
export const MaxBlockChildren = 100;
/** Items in one block's `rich_text` array. */
export const MaxRichTextItems = 100;
/** Characters in an equation's `expression`. */
export const MaxEquationLength = 1000;
/** Characters in a link's `url`. */
export const MaxUrlLength = 2000;
/**
 * Characters of text one block carries before the remainder moves to a
 * continuation block. Notion has no such per-block limit; this keeps a single
 * block far below the 500KB request ceiling even when every character takes
 * several bytes, so one enormous paragraph can never be unsendable.
 */
export const MaxBlockTextLength = 50_000;

export interface NotionAnnotations {
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly strikethrough?: boolean;
  readonly underline?: boolean;
  readonly code?: boolean;
  readonly color?: ApiColor;
}

export type NotionMention =
  | { readonly type: "user"; readonly user: { readonly id: string } }
  | { readonly type: "page"; readonly page: { readonly id: string } }
  | { readonly type: "database"; readonly database: { readonly id: string } }
  | { readonly type: "date"; readonly date: { readonly start: string; readonly end: string | null } };

export type NotionRichTextItem =
  | {
      readonly type: "text";
      readonly text: { readonly content: string; readonly link: { readonly url: string } | null };
      readonly annotations?: NotionAnnotations;
      readonly plain_text?: string;
    }
  | {
      readonly type: "equation";
      readonly equation: { readonly expression: string };
      readonly annotations?: NotionAnnotations;
      readonly plain_text?: string;
    }
  | {
      readonly type: "mention";
      readonly mention: NotionMention;
      readonly annotations?: NotionAnnotations;
      readonly plain_text?: string;
    };

export interface NotionIcon {
  readonly type: "emoji";
  readonly emoji: string;
}

interface TextContent {
  readonly rich_text: NotionRichTextItem[];
  readonly color?: ApiColor;
  readonly children?: NotionBlock[];
}

/** A heading may hold children only as a toggle heading, which is what `is_toggleable` declares. */
interface HeadingContent extends TextContent {
  readonly is_toggleable?: boolean;
}

/**
 * See the module doc comment: a local, unlimited-depth stand-in for
 * `BlockObjectRequest`/`BlockObjectResponse`. As in Notion's requests, a
 * block's `children` live inside its type object (`paragraph.children`), not
 * beside it.
 */
export type NotionBlock =
  | { readonly type: "paragraph"; readonly paragraph: TextContent }
  | { readonly type: "heading_1"; readonly heading_1: HeadingContent }
  | { readonly type: "heading_2"; readonly heading_2: HeadingContent }
  | { readonly type: "heading_3"; readonly heading_3: HeadingContent }
  | { readonly type: "heading_4"; readonly heading_4: HeadingContent }
  | { readonly type: "bulleted_list_item"; readonly bulleted_list_item: TextContent }
  | { readonly type: "numbered_list_item"; readonly numbered_list_item: TextContent }
  | { readonly type: "to_do"; readonly to_do: TextContent & { readonly checked?: boolean } }
  | { readonly type: "quote"; readonly quote: TextContent }
  | { readonly type: "code"; readonly code: { readonly rich_text: NotionRichTextItem[]; readonly language: string } }
  | { readonly type: "divider"; readonly divider: Record<string, never> }
  | { readonly type: "callout"; readonly callout: TextContent & { readonly icon?: NotionIcon } }
  | { readonly type: "toggle"; readonly toggle: TextContent }
  | { readonly type: "equation"; readonly equation: { readonly expression: string } };

/** A block's nested children, wherever a caller's object carries them: inside the type object (Notion's request shape) or, for objects assembled by hand, beside it. */
export function GetNotionBlockChildren(Node: NotionBlock): readonly NotionBlock[] {
  const Content = (Node as unknown as Record<string, { children?: NotionBlock[] } | undefined>)[Node.type];
  const Beside = (Node as { children?: NotionBlock[] }).children;
  return Content?.children ?? Beside ?? [];
}

/** A copy of `Node` holding exactly `Children` (none, when empty), in the request shape. */
export function WithNotionBlockChildren(Node: NotionBlock, Children: readonly NotionBlock[]): NotionBlock {
  const { children: _Beside, ...Rest } = Node as NotionBlock & { children?: NotionBlock[] };
  const Record_ = Rest as unknown as Record<string, Record<string, unknown>>;
  const { children: _Inside, ...Content } = Record_[Node.type]!;
  return { ...Rest, [Node.type]: Children.length > 0 ? { ...Content, children: [...Children] } : Content } as unknown as NotionBlock;
}

// --- Color: our compact `_bg` suffix <-> Notion's real `_background` ApiColor ---

/** Our Enhanced-Markdown-shaped `red_bg` becomes the API's `red_background`. */
export function ColorValueToApiColor(Color: ColorValue): ApiColor {
  return (Color.endsWith("_bg") ? Color.replace(/_bg$/, "_background") : Color) as ApiColor;
}

/** The API's `red_background` becomes our Enhanced-Markdown-shaped `red_bg`. */
export function ApiColorToColorValue(Color: ApiColor): ColorValue {
  const Value = Color.endsWith("_background") ? Color.replace(/_background$/, "_bg") : Color;
  return IsColorValue(Value) ? Value : "default";
}

function ColorField(Color: ColorValue | undefined): { color?: ApiColor } {
  if (Color === undefined || Color === "default") return {};
  return { color: ColorValueToApiColor(Color) };
}

function ColorAttribute(Color: ApiColor | undefined): { Color?: ColorValue } {
  if (Color === undefined || Color === "default") return {};
  return { Color: ApiColorToColorValue(Color) };
}

// --- Inline rich text ---

interface AccumulatedAnnotations {
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly strikethrough?: boolean;
  readonly underline?: boolean;
  readonly code?: boolean;
  readonly color?: ApiColor;
}

function HasAnyAnnotation(Annotations: AccumulatedAnnotations): boolean {
  return Object.keys(Annotations).length > 0;
}

/** Splits `Text` into pieces of at most `Limit` UTF-16 units without ever separating a surrogate pair, which would leave an unpaired half in each piece. */
export function ChunkText(Text: string, Limit: number): string[] {
  const Chunks: string[] = [];
  let Start = 0;
  while (Start < Text.length) {
    let End = Math.min(Start + Limit, Text.length);
    const Last = Text.charCodeAt(End - 1);
    if (End < Text.length && Last >= 0xd800 && Last <= 0xdbff && End - Start > 1) End -= 1;
    Chunks.push(Text.slice(Start, End));
    Start = End;
  }
  return Chunks;
}

function PushTextRun(Text: string, Annotations: AccumulatedAnnotations, Out: NotionRichTextItem[], LinkUrl?: string): void {
  if (Text.length === 0) return;
  const AnnotationField = HasAnyAnnotation(Annotations) ? { annotations: Annotations } : {};
  for (const Chunk of ChunkText(Text, MaxRichTextLength)) {
    Out.push({
      type: "text",
      text: { content: Chunk, link: LinkUrl !== undefined ? { url: LinkUrl } : null },
      ...AnnotationField,
    });
  }
}

/**
 * The URL Notion will accept for a link, or `undefined` when there is none:
 * Notion rejects the whole request over one malformed or over-long `url`, and
 * a link typed by hand can be anything. A bare domain gets `https://`.
 */
export function NormalizeLinkUrl(Url: string): string | undefined {
  const Trimmed = Url.trim();
  if (Trimmed.length === 0 || /\s/.test(Trimmed)) return undefined;
  const Candidate = /^[a-z][a-z0-9+.-]*:/i.test(Trimmed) ? Trimmed : /^[^/?#]+\.[^/?#]+/.test(Trimmed) ? `https://${Trimmed}` : undefined;
  if (Candidate === undefined || Candidate.length > MaxUrlLength) return undefined;
  if (!/^(https?:\/\/[^/?#\s]+|mailto:[^\s]+|tel:[^\s]+)/i.test(Candidate)) return undefined;
  return Candidate;
}

const UuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Whether a mention names something Notion can resolve. One typed by hand (or carrying a display URL instead of an id) cannot be sent as a mention. */
function IsSendableMention(Node: Extract<InlineNode, { Type: "Mention" }>): boolean {
  return Node.MentionKind === "date" ? /^\d{4}-\d{2}-\d{2}/.test(Node.Start) : UuidPattern.test(Node.Url);
}

function MentionNodeToNotionMention(Node: Extract<InlineNode, { Type: "Mention" }>): NotionMention {
  switch (Node.MentionKind) {
    case "user":
      return { type: "user", user: { id: Node.Url } };
    case "page":
      return { type: "page", page: { id: Node.Url } };
    case "database":
      return { type: "database", database: { id: Node.Url } };
    case "date":
      return { type: "date", date: { start: Node.Start, end: Node.End } };
  }
}

function CollectRichText(Nodes: readonly InlineNode[], Annotations: AccumulatedAnnotations, Out: NotionRichTextItem[]): void {
  for (const Node of Nodes) {
    switch (Node.Type) {
      case "Text":
        PushTextRun(Node.Text, Annotations, Out);
        break;
      case "Bold":
        CollectRichText(Node.Children, { ...Annotations, bold: true }, Out);
        break;
      case "Italic":
        CollectRichText(Node.Children, { ...Annotations, italic: true }, Out);
        break;
      case "Strikethrough":
        CollectRichText(Node.Children, { ...Annotations, strikethrough: true }, Out);
        break;
      case "Underline":
        CollectRichText(Node.Children, { ...Annotations, underline: true }, Out);
        break;
      case "Color":
        CollectRichText(Node.Children, { ...Annotations, color: ColorValueToApiColor(Node.Color) }, Out);
        break;
      case "Code":
        PushTextRun(Node.Text, { ...Annotations, code: true }, Out);
        break;
      case "Link": {
        // Notion's `link` lives on each individual text item, not as a
        // wrapper — collect the link's children normally, then stamp the
        // url onto whichever resulting items are text runs.
        const Inner: NotionRichTextItem[] = [];
        CollectRichText(Node.Children, Annotations, Inner);
        const Url = NormalizeLinkUrl(Node.Url);
        for (const Item of Inner) {
          // A link Notion would reject keeps its text and loses only the link.
          Out.push(Item.type === "text" && Url !== undefined ? { ...Item, text: { ...Item.text, link: { url: Url } } } : Item);
        }
        break;
      }
      case "Equation":
        // An expression too long for Notion's equation type is kept as its LaTeX source.
        if (Node.Expression.length > MaxEquationLength) {
          PushTextRun(`$${Node.Expression}$`, Annotations, Out);
          break;
        }
        Out.push({
          type: "equation",
          equation: { expression: Node.Expression },
          ...(HasAnyAnnotation(Annotations) ? { annotations: Annotations } : {}),
        });
        break;
      case "LineBreak":
        PushTextRun("\n", Annotations, Out);
        break;
      case "Mention":
        // `plain_text` is response-only: Notion derives it, and rejects it in a request.
        if (IsSendableMention(Node)) Out.push({ type: "mention", mention: MentionNodeToNotionMention(Node) });
        else PushTextRun(MentionDisplayText(Node), Annotations, Out);
        break;
    }
  }
}

function MentionDisplayText(Node: Extract<InlineNode, { Type: "Mention" }>): string {
  return Node.MentionKind === "date" ? Node.Start : Node.DisplayText;
}

export function InlineNodesToRichText(Nodes: readonly InlineNode[]): NotionRichTextItem[] {
  const Out: NotionRichTextItem[] = [];
  CollectRichText(Nodes, {}, Out);
  return Out;
}

function MentionItemToInlineNode(Item: Extract<NotionRichTextItem, { type: "mention" }>): InlineNode {
  const DisplayText = Item.plain_text ?? "";
  switch (Item.mention.type) {
    case "user":
      return { Type: "Mention", MentionKind: "user", Url: Item.mention.user.id, DisplayText };
    case "page":
      return { Type: "Mention", MentionKind: "page", Url: Item.mention.page.id, DisplayText };
    case "database":
      return { Type: "Mention", MentionKind: "database", Url: Item.mention.database.id, DisplayText };
    case "date":
      return { Type: "Mention", MentionKind: "date", Start: Item.mention.date.start, End: Item.mention.date.end };
  }
}

/**
 * Converts one flat, annotated rich-text item back into a (possibly
 * wrapped) inline node. Wrapping order is fixed (Bold, then Italic, then
 * Strikethrough, then Underline, then Color, outermost last) for internal
 * consistency; Notion's flat annotation set does not, in general, recover
 * the exact original nesting `InlineNodesToRichText` started from when a
 * link is combined with other annotations — a documented simplification,
 * not a bug, since a flat annotation set is inherently ambiguous about
 * nesting order.
 */
function RichTextItemToInlineNode(Item: NotionRichTextItem): InlineNode {
  if (Item.type === "mention") return MentionItemToInlineNode(Item);

  let Leaf: InlineNode =
    Item.type === "equation"
      ? { Type: "Equation", Expression: Item.equation.expression }
      : Item.annotations?.code
        ? { Type: "Code", Text: Item.text.content }
        : { Type: "Text", Text: Item.text.content };

  if (Item.type === "text" && Item.text.link) {
    Leaf = { Type: "Link", Url: Item.text.link.url, Children: [Leaf] };
  }

  const Annotations = Item.annotations;
  if (Annotations?.bold) Leaf = { Type: "Bold", Children: [Leaf] };
  if (Annotations?.italic) Leaf = { Type: "Italic", Children: [Leaf] };
  if (Annotations?.strikethrough) Leaf = { Type: "Strikethrough", Children: [Leaf] };
  if (Annotations?.underline) Leaf = { Type: "Underline", Children: [Leaf] };
  if (Annotations?.color && Annotations.color !== "default") {
    Leaf = { Type: "Color", Color: ApiColorToColorValue(Annotations.color), Children: [Leaf] };
  }

  return Leaf;
}

function MergeAdjacentText(Nodes: readonly InlineNode[]): InlineNode[] {
  const Result: InlineNode[] = [];
  for (const Node of Nodes) {
    const Last = Result[Result.length - 1];
    if (Last && Last.Type === "Text" && Node.Type === "Text") {
      Result[Result.length - 1] = { Type: "Text", Text: Last.Text + Node.Text };
    } else {
      Result.push(Node);
    }
  }
  return Result;
}

export function RichTextToInlineNodes(Items: readonly NotionRichTextItem[]): InlineNode[] {
  return MergeAdjacentText(Items.map(RichTextItemToInlineNode));
}

function PlainTextFromRichText(Items: readonly NotionRichTextItem[]): string {
  return Items
    .map((Item) => (Item.type === "text" ? Item.text.content : Item.type === "equation" ? Item.equation.expression : Item.plain_text ?? ""))
    .join("");
}

// --- Block tree ---

/** Notion's code-block languages. Anything else is rejected, so an unknown fence label falls back to `plain text`. */
const NotionLanguages: ReadonlySet<string> = new Set([
  "abap", "abc", "agda", "arduino", "ascii art", "assembly", "bash", "basic", "bnf", "c", "c#", "c++", "clojure", "coffeescript",
  "coq", "css", "dart", "dhall", "diff", "docker", "ebnf", "elixir", "elm", "erlang", "f#", "flow", "fortran", "gherkin", "glsl",
  "go", "graphql", "groovy", "haskell", "hcl", "html", "idris", "java", "javascript", "json", "julia", "kotlin", "latex", "less",
  "lisp", "livescript", "llvm ir", "lua", "makefile", "markdown", "markup", "matlab", "mathematica", "mermaid", "nix",
  "notion formula", "objective-c", "ocaml", "pascal", "perl", "php", "plain text", "powershell", "prolog", "protobuf",
  "purescript", "python", "r", "racket", "reason", "ruby", "rust", "sass", "scala", "scheme", "scss", "shell", "smalltalk",
  "solidity", "sql", "swift", "toml", "typescript", "vb.net", "verilog", "vhdl", "visual basic", "webassembly", "xml", "yaml",
  "java/c/c++/c#",
]);

const LanguageAliases: Readonly<Record<string, string>> = {
  "": "plain text", text: "plain text", txt: "plain text", plaintext: "plain text", plain: "plain text",
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", rb: "ruby", rs: "rust", kt: "kotlin", cs: "c#", csharp: "c#", cpp: "c++", "objc": "objective-c",
  sh: "shell", zsh: "shell", ps1: "powershell", yml: "yaml", md: "markdown", tex: "latex", golang: "go",
  dockerfile: "docker", make: "makefile", proto: "protobuf", wasm: "webassembly", vb: "visual basic", fs: "f#", fsharp: "f#",
};

/** The Notion language name for a Markdown fence label. */
export function NormalizeCodeLanguage(Language: string | null): string {
  const Key = (Language ?? "").trim().toLowerCase();
  const Resolved = LanguageAliases[Key] ?? Key;
  return NotionLanguages.has(Resolved) ? Resolved : "plain text";
}

/** Notion accepts only a real emoji as an emoji icon; anything else in a callout's `icon` attribute is left off rather than failing the request. */
function EmojiIcon(Icon: string | null): { icon?: NotionIcon } {
  if (Icon === null || Icon.length === 0 || Icon.length > 16 || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(Icon)) return {};
  return { icon: { type: "emoji", emoji: Icon } };
}

function ItemLength(Item: NotionRichTextItem): number {
  return Item.type === "text" ? Item.text.content.length : Item.type === "equation" ? Item.equation.expression.length : 0;
}

/**
 * Splits one block's rich text wherever it would exceed what a single block
 * may carry: `MaxRichTextItems` items, or `MaxBlockTextLength` characters.
 * Almost always returns the input as its only group.
 */
function GroupRichText(Items: NotionRichTextItem[]): NotionRichTextItem[][] {
  const Groups: NotionRichTextItem[][] = [[]];
  let Length = 0;
  for (const Item of Items) {
    const Current = Groups[Groups.length - 1]!;
    const Size = ItemLength(Item);
    if (Current.length > 0 && (Current.length >= MaxRichTextItems || Length + Size > MaxBlockTextLength)) {
      Groups.push([Item]);
      Length = Size;
    } else {
      Current.push(Item);
      Length += Size;
    }
  }
  return Groups;
}

const Paragraphs = (Groups: NotionRichTextItem[][]): NotionBlock[] => Groups.map((Group) => ({ type: "paragraph", paragraph: { rich_text: Group } }));

/**
 * Converts one AST block, with its already-converted children, into the
 * Notion blocks that represent it at its own level — one block, except when:
 *
 * - its text is too long for one block (see `GroupRichText`): the overflow
 *   continues in further blocks, as the first children of a block that can
 *   hold children, and as following siblings otherwise;
 * - it cannot hold children at all (code, equation, divider): children a
 *   hand-edited document nested under it follow it as siblings, so nothing
 *   is dropped.
 */
function BlockToNotionBlocks(Node: Block, Children: NotionBlock[]): NotionBlock[] {
  const Nest = (RichText: NotionRichTextItem[]): { First: NotionRichTextItem[]; Children: NotionBlock[] } => {
    const [First, ...Overflow] = GroupRichText(RichText);
    return { First: First!, Children: [...Paragraphs(Overflow), ...Children] };
  };
  const ChildrenField = (Blocks: NotionBlock[]): { children?: NotionBlock[] } => (Blocks.length > 0 ? { children: Blocks } : {});

  switch (Node.Type) {
    case "Paragraph": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "paragraph", paragraph: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "Heading": {
      // A heading holds children only as a toggle heading, so one with nested blocks becomes toggleable; overflow text follows it as paragraphs instead.
      const [First, ...Overflow] = GroupRichText(InlineNodesToRichText(Node.Content));
      const Content = { rich_text: First!, ...ColorField(Node.Color), ...(Children.length > 0 ? { is_toggleable: true, children: Children } : {}) };
      const Heading: NotionBlock =
        Node.Level === 1 ? { type: "heading_1", heading_1: Content }
        : Node.Level === 2 ? { type: "heading_2", heading_2: Content }
        : Node.Level === 3 ? { type: "heading_3", heading_3: Content }
        : { type: "heading_4", heading_4: Content };
      return [Heading, ...Paragraphs(Overflow)];
    }
    case "BulletedListItem": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "bulleted_list_item", bulleted_list_item: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "NumberedListItem": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "numbered_list_item", numbered_list_item: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "ToDo": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "to_do", to_do: { rich_text: Text.First, checked: Node.Checked, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "Quote": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "quote", quote: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "Toggle": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "toggle", toggle: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "Code": {
      // Code is rich text like any other: 2,000 characters per item, and a further code block once one is full.
      const Items: NotionRichTextItem[] = [];
      PushTextRun(Node.Text, {}, Items);
      const Language = NormalizeCodeLanguage(Node.Language);
      const Blocks: NotionBlock[] = GroupRichText(Items).map((Group) => ({ type: "code", code: { rich_text: Group, language: Language } }));
      return [...Blocks, ...Children];
    }
    case "Divider":
      return [{ type: "divider", divider: {} }, ...Children];
    case "Callout": {
      // Our AST gives a callout no text of its own (see Ast.ts): what it
      // shows is its first child paragraph. Notion draws a callout's own
      // `rich_text` on its first line, so that paragraph's text goes there
      // — otherwise every callout would open with an empty line. This
      // mirrors `FlattenNotionBlocks`, which turns `rich_text` back into a
      // leading paragraph. A leading paragraph with its own color or
      // children stays a child, since `rich_text` could not carry either.
      const [Lead, ...Rest] = Children;
      const LeadContent = Lead?.type === "paragraph" && Lead.paragraph.color === undefined && Lead.paragraph.children === undefined ? Lead.paragraph.rich_text : undefined;
      return [{
        type: "callout",
        callout: {
          rich_text: LeadContent ?? [],
          ...EmojiIcon(Node.Icon),
          ...ColorField(Node.Color),
          ...ChildrenField(LeadContent !== undefined ? Rest : Children),
        },
      }];
    }
    case "Equation":
      // Notion caps an equation's expression; a longer one is kept, as LaTeX source in a code block.
      return Node.Expression.length > MaxEquationLength
        ? [...BlockToNotionBlocks({ Type: "Code", Depth: Node.Depth, Language: "latex", Text: Node.Expression }, []), ...Children]
        : [{ type: "equation", equation: { expression: Node.Expression } }, ...Children];
  }
}

/**
 * Groups the flat, Depth-tagged block array into Notion's nested
 * `children`-array tree. Tolerant of depth jumps greater than 1 (which a
 * well-formed document from `Parser.ts` never produces, but a hand-edited
 * one might): the first block deeper than `ParentDepth` sets the sibling
 * depth for that run, however deep it is.
 */
function BuildNotionBlockTree(Blocks: readonly Block[], Cursor: { Index: number }, ParentDepth: number): NotionBlock[] {
  const Result: NotionBlock[] = [];
  while (Cursor.Index < Blocks.length) {
    const Current = Blocks[Cursor.Index]!;
    if (Current.Depth <= ParentDepth) break;
    const ChildDepth = Current.Depth;
    Cursor.Index += 1;
    const Children = BuildNotionBlockTree(Blocks, Cursor, ChildDepth);
    Result.push(...BlockToNotionBlocks(Current, Children));
  }
  return Result;
}

/**
 * Converts a document into Notion request blocks. The tree is as deep and as
 * wide as the document: fitting it into requests Notion accepts (100 blocks
 * per `children` array, two levels of nesting, 1,000 blocks per request) is
 * `NotionRequest.ts`'s job.
 */
export function DocumentToNotionBlocks(Doc: Document): NotionBlock[] {
  return BuildNotionBlockTree(Doc.Blocks, { Index: 0 }, -1);
}

function NotionBlockToBlock(Node: NotionBlock, Depth: number): Block {
  switch (Node.type) {
    case "paragraph":
      return { Type: "Paragraph", Depth, ...ColorAttribute(Node.paragraph.color), Content: RichTextToInlineNodes(Node.paragraph.rich_text) };
    case "heading_1":
      return { Type: "Heading", Depth, Level: 1, ...ColorAttribute(Node.heading_1.color), Content: RichTextToInlineNodes(Node.heading_1.rich_text) };
    case "heading_2":
      return { Type: "Heading", Depth, Level: 2, ...ColorAttribute(Node.heading_2.color), Content: RichTextToInlineNodes(Node.heading_2.rich_text) };
    case "heading_3":
      return { Type: "Heading", Depth, Level: 3, ...ColorAttribute(Node.heading_3.color), Content: RichTextToInlineNodes(Node.heading_3.rich_text) };
    case "heading_4":
      return { Type: "Heading", Depth, Level: 4, ...ColorAttribute(Node.heading_4.color), Content: RichTextToInlineNodes(Node.heading_4.rich_text) };
    case "bulleted_list_item":
      return { Type: "BulletedListItem", Depth, ...ColorAttribute(Node.bulleted_list_item.color), Content: RichTextToInlineNodes(Node.bulleted_list_item.rich_text) };
    case "numbered_list_item":
      return { Type: "NumberedListItem", Depth, ...ColorAttribute(Node.numbered_list_item.color), Content: RichTextToInlineNodes(Node.numbered_list_item.rich_text) };
    case "to_do":
      return { Type: "ToDo", Depth, Checked: Node.to_do.checked ?? false, ...ColorAttribute(Node.to_do.color), Content: RichTextToInlineNodes(Node.to_do.rich_text) };
    case "quote":
      return { Type: "Quote", Depth, ...ColorAttribute(Node.quote.color), Content: RichTextToInlineNodes(Node.quote.rich_text) };
    case "code":
      return { Type: "Code", Depth, Language: Node.code.language, Text: PlainTextFromRichText(Node.code.rich_text) };
    case "divider":
      return { Type: "Divider", Depth };
    case "callout":
      return { Type: "Callout", Depth, Icon: Node.callout.icon?.type === "emoji" ? Node.callout.icon.emoji : null, ...ColorAttribute(Node.callout.color) };
    case "toggle":
      return { Type: "Toggle", Depth, ...ColorAttribute(Node.toggle.color), Content: RichTextToInlineNodes(Node.toggle.rich_text) };
    case "equation":
      return { Type: "Equation", Depth, Expression: Node.equation.expression };
  }
}

/**
 * Flattens Notion's nested block tree back into our flat, Depth-tagged
 * array. Callout is special-cased: since our AST keeps no `rich_text` of
 * its own for Callout (see Ast.ts), a real Notion callout's own text is
 * folded into a synthetic leading Paragraph child at `Depth + 1` rather
 * than lost — a one-way normalization, not a byte-identical round trip of
 * the original Notion block object.
 */
function FlattenNotionBlocks(Blocks: readonly NotionBlock[], Depth: number, Out: Block[]): void {
  for (const Node of Blocks) {
    if (Node.type === "callout") {
      Out.push({ Type: "Callout", Depth, Icon: Node.callout.icon?.type === "emoji" ? Node.callout.icon.emoji : null, ...ColorAttribute(Node.callout.color) });
      if (Node.callout.rich_text.length > 0) {
        Out.push({ Type: "Paragraph", Depth: Depth + 1, Content: RichTextToInlineNodes(Node.callout.rich_text) });
      }
      FlattenNotionBlocks(GetNotionBlockChildren(Node), Depth + 1, Out);
      continue;
    }

    Out.push(NotionBlockToBlock(Node, Depth));
    FlattenNotionBlocks(GetNotionBlockChildren(Node), Depth + 1, Out);
  }
}

export function NotionBlocksToDocument(Blocks: readonly NotionBlock[]): Document {
  const Result: Block[] = [];
  FlattenNotionBlocks(Blocks, 0, Result);
  return { Blocks: Result };
}

/**
 * Splits a top-level children array into groups of at most
 * `MaxBlockChildren`, for call sites that must page multiple
 * `appendBlockChildren` requests. Applies to the given array only — nested
 * `children` are left as constructed; a container whose own children
 * exceed the limit is a call site's concern (it must create the container
 * first, then page in its children via separate append calls).
 */
export function ChunkChildren(Blocks: readonly NotionBlock[]): NotionBlock[][] {
  if (Blocks.length === 0) return [[]];
  const Chunks: NotionBlock[][] = [];
  for (let Start = 0; Start < Blocks.length; Start += MaxBlockChildren) {
    Chunks.push(Blocks.slice(Start, Start + MaxBlockChildren));
  }
  return Chunks;
}
