/**
 * The React-free entry: the Enhanced Markdown parser, serializer, Notion
 * bridge, and the portable types they share. Nothing reachable from here may
 * import `react`, `react-native`, or anything under `./Component` or `./Hook`,
 * so a server runtime can bundle it — `Test/core-entry.test.mjs` enforces that.
 */

export type { Block, BlockType, Document, HeadingLevel, InlineNode, MentionNode } from "./Ast.js";
export { IsColorValue, NotionColors, type ColorValue, type NotionColor } from "./Colors.js";
export { Parse, ParseInline } from "./Parser.js";
export { Serialize, SerializeInline } from "./Serializer.js";
export {
  ApiColorToColorValue,
  ChunkChildren,
  ChunkText,
  ColorValueToApiColor,
  DocumentToNotionBlocks,
  GetNotionBlockChildren,
  InlineNodesToRichText,
  MaxBlockChildren,
  MaxBlockTextLength,
  MaxEquationLength,
  MaxRichTextItems,
  MaxRichTextLength,
  MaxUrlLength,
  NormalizeCodeLanguage,
  NormalizeLinkUrl,
  NotionBlocksToDocument,
  RichTextToInlineNodes,
  WithNotionBlockChildren,
  type NotionAnnotations,
  type NotionBlock,
  type NotionIcon,
  type NotionMention,
  type NotionRichTextItem,
} from "./NotionBridge.js";
export {
  AppendNotionBlocks,
  MarkdownToNotionBlocks,
  MaxNestingLevels,
  MaxRequestBlocks,
  MaxRequestBytes,
  PlainTextToNotionBlocks,
  PlanPageChildren,
  type NotionAppend,
  type PageChildrenPlan,
} from "./NotionRequest.js";
