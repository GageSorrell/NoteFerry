/**
 * Parses Notion's Enhanced Markdown format into `Document`.
 *
 * https://developers.notion.com/guides/data-apis/enhanced-markdown
 *
 * Each block occupies exactly one source line (fenced code, block
 * equations, callouts, and toggles are the multi-line exceptions);
 * indentation is literal leading tabs, one per depth level. Blank lines
 * are pure separators and carry no meaning.
 *
 * Milestone 1 covered the plain CommonMark-compatible constructs.
 * Milestone 2 (this revision) adds callouts (`<callout>`), toggles
 * (`<details>`/`<summary>`), block equations (`$$...$$`), the block-level
 * `{color="..."}` attribute, and the inline extensions handled by
 * `ParseInline` (`<span color/underline>`, `<br>`, `$...$`, `<mention-*>`).
 */

import type { Block, Document, HeadingLevel, InlineNode } from "./Ast.js";
import { IsColorValue, type ColorValue } from "./Colors.js";
import { EscapableCharacters } from "./Escape.js";

const HeadingPattern = /^(#{1,4})\s+(.*)$/;
const ToDoPattern = /^-\s\[([ xX])\]\s+(.*)$/;
const BulletedListPattern = /^-\s+(.*)$/;
const NumberedListPattern = /^\d+\.\s+(.*)$/;
const QuotePattern = /^>\s?(.*)$/;
const DividerPattern = /^---$/;
const FenceOpenPattern = /^```(\S*)\s*$/;
const FenceClosePattern = /^```\s*$/;
const EquationFencePattern = /^\$\$$/;
const CalloutOpenPattern = /^<callout([^>]*)>$/;
const DetailsOpenPattern = /^<details([^>]*)>$/;
const SummaryPattern = /^<summary>(.*)<\/summary>$/;
const BlockColorPattern = /^(.*)\{color="([a-z_]+)"\}$/;

/** Splits a line into its leading-tab depth and the remaining content. */
function StripIndentation(Line: string): { Depth: number; Rest: string } {
  let Depth = 0;
  while (Depth < Line.length && Line[Depth] === "\t") Depth += 1;
  return { Depth, Rest: Line.slice(Depth) };
}

/** Parses `key="value"` pairs out of a tag's attribute substring. */
function ParseTagAttributes(AttributeText: string): Map<string, string> {
  const Attributes = new Map<string, string>();
  const Pattern = /(\w+)="([^"]*)"/g;
  let Match: RegExpExecArray | null;
  while ((Match = Pattern.exec(AttributeText)) !== null) {
    Attributes.set(Match[1]!, Match[2]!);
  }
  return Attributes;
}

function ReadColorAttribute(Attributes: Map<string, string>): ColorValue | undefined {
  const Value = Attributes.get("color");
  return Value !== undefined && IsColorValue(Value) ? Value : undefined;
}

/** Strips a trailing `{color="..."}` attribute from a content-block line, if present and valid. */
function ExtractBlockColor(Rest: string): { Rest: string; Color: ColorValue | undefined } {
  const Match = BlockColorPattern.exec(Rest);
  if (Match) {
    const Candidate = Match[2]!;
    if (IsColorValue(Candidate)) {
      return { Rest: Match[1]!.replace(/\s+$/, ""), Color: Candidate };
    }
  }
  return { Rest, Color: undefined };
}

export function Parse(Source: string): Document {
  const Lines = Source.split(/\r\n|\r|\n/);
  const Blocks: Block[] = [];
  let Index = 0;

  while (Index < Lines.length) {
    const RawLine = Lines[Index]!;

    if (RawLine.trim().length === 0) {
      Index += 1;
      continue;
    }

    const { Depth, Rest: IndentStrippedRest } = StripIndentation(RawLine);

    const FenceOpen = FenceOpenPattern.exec(IndentStrippedRest);
    if (FenceOpen) {
      const Language = FenceOpen[1]!.length > 0 ? FenceOpen[1]! : null;
      const ContentLines: string[] = [];
      Index += 1;
      while (Index < Lines.length && !FenceClosePattern.test(StripIndentation(Lines[Index]!).Rest)) {
        ContentLines.push(Lines[Index]!);
        Index += 1;
      }
      if (Index < Lines.length) Index += 1; // Skip the closing fence line.
      Blocks.push({ Type: "Code", Depth, Language, Text: ContentLines.join("\n") });
      continue;
    }

    if (DividerPattern.test(IndentStrippedRest)) {
      Blocks.push({ Type: "Divider", Depth });
      Index += 1;
      continue;
    }

    const CalloutOpen = CalloutOpenPattern.exec(IndentStrippedRest);
    if (CalloutOpen) {
      const Attributes = ParseTagAttributes(CalloutOpen[1]!);
      const Icon = Attributes.get("icon") ?? null;
      const Color = ReadColorAttribute(Attributes);
      Blocks.push({ Type: "Callout", Depth, Icon, ...(Color !== undefined ? { Color } : {}) });
      Index += 1;
      continue;
    }

    const DetailsOpen = DetailsOpenPattern.exec(IndentStrippedRest);
    if (DetailsOpen) {
      const Attributes = ParseTagAttributes(DetailsOpen[1]!);
      const Color = ReadColorAttribute(Attributes);
      Index += 1;

      let Content: InlineNode[] = [];
      if (Index < Lines.length) {
        const Next = StripIndentation(Lines[Index]!);
        if (Next.Depth === Depth) {
          const SummaryMatch = SummaryPattern.exec(Next.Rest);
          if (SummaryMatch) {
            Content = ParseInline(SummaryMatch[1]!);
            Index += 1; // Consume the summary line too.
          }
        }
      }

      Blocks.push({ Type: "Toggle", Depth, Content, ...(Color !== undefined ? { Color } : {}) });
      continue;
    }

    if (IndentStrippedRest === "</callout>" || IndentStrippedRest === "</details>") {
      // Purely structural — the flat Depth-tagged array already captures
      // the hierarchy, so the closing tag carries no data of its own.
      Index += 1;
      continue;
    }

    if (EquationFencePattern.test(IndentStrippedRest)) {
      const ExpressionLines: string[] = [];
      Index += 1;
      while (Index < Lines.length && !EquationFencePattern.test(StripIndentation(Lines[Index]!).Rest)) {
        ExpressionLines.push(Lines[Index]!);
        Index += 1;
      }
      if (Index < Lines.length) Index += 1; // Skip the closing $$.
      Blocks.push({ Type: "Equation", Depth, Expression: ExpressionLines.join("\n") });
      continue;
    }

    const { Rest, Color: BlockColor } = ExtractBlockColor(IndentStrippedRest);
    const ColorField = BlockColor !== undefined ? { Color: BlockColor } : {};

    const Heading = HeadingPattern.exec(Rest);
    if (Heading) {
      const Level = Heading[1]!.length as HeadingLevel;
      Blocks.push({ Type: "Heading", Depth, Level, ...ColorField, Content: ParseInline(Heading[2]!) });
      Index += 1;
      continue;
    }

    const ToDo = ToDoPattern.exec(Rest);
    if (ToDo) {
      Blocks.push({
        Type: "ToDo",
        Depth,
        Checked: ToDo[1]!.toLowerCase() === "x",
        ...ColorField,
        Content: ParseInline(ToDo[2]!),
      });
      Index += 1;
      continue;
    }

    const Bulleted = BulletedListPattern.exec(Rest);
    if (Bulleted) {
      Blocks.push({ Type: "BulletedListItem", Depth, ...ColorField, Content: ParseInline(Bulleted[1]!) });
      Index += 1;
      continue;
    }

    const Numbered = NumberedListPattern.exec(Rest);
    if (Numbered) {
      Blocks.push({ Type: "NumberedListItem", Depth, ...ColorField, Content: ParseInline(Numbered[1]!) });
      Index += 1;
      continue;
    }

    const Quote = QuotePattern.exec(Rest);
    if (Quote) {
      Blocks.push({ Type: "Quote", Depth, ...ColorField, Content: ParseInline(Quote[1]!) });
      Index += 1;
      continue;
    }

    Blocks.push({ Type: "Paragraph", Depth, ...ColorField, Content: ParseInline(Rest) });
    Index += 1;
  }

  return { Blocks };
}

/**
 * Parses one line's worth of rich text into inline nodes. Recurses into
 * nested spans (e.g. `**bold *and italic***`), so callers should not
 * re-parse a node's `Children`.
 */
export function ParseInline(Text: string): InlineNode[] {
  const Nodes: InlineNode[] = [];
  let Buffer = "";
  let Index = 0;

  const FlushBuffer = (): void => {
    if (Buffer.length > 0) {
      Nodes.push({ Type: "Text", Text: Buffer });
      Buffer = "";
    }
  };

  while (Index < Text.length) {
    const Character = Text[Index];

    if (Character === "\\" && Index + 1 < Text.length && EscapableCharacters.has(Text[Index + 1]!)) {
      Buffer += Text[Index + 1];
      Index += 2;
      continue;
    }

    if (Character === "`") {
      const End = Text.indexOf("`", Index + 1);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Code", Text: Text.slice(Index + 1, End) });
        Index = End + 1;
        continue;
      }
    }

    if (Character === "$") {
      const End = Text.indexOf("$", Index + 1);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Equation", Expression: Text.slice(Index + 1, End) });
        Index = End + 1;
        continue;
      }
    }

    if (Character === "<") {
      const Remainder = Text.slice(Index);

      const SpanMatch = /^<span\s+(color|underline)="([^"]*)">/.exec(Remainder);
      if (SpanMatch) {
        const AttributeName = SpanMatch[1]!;
        const AttributeValue = SpanMatch[2]!;
        const OpenTagLength = SpanMatch[0].length;
        const CloseIndex = Text.indexOf("</span>", Index + OpenTagLength);
        if (CloseIndex !== -1) {
          FlushBuffer();
          const InnerText = Text.slice(Index + OpenTagLength, CloseIndex);
          const InnerNodes = ParseInline(InnerText);
          if (AttributeName === "color" && IsColorValue(AttributeValue)) {
            Nodes.push({ Type: "Color", Color: AttributeValue, Children: InnerNodes });
          } else if (AttributeName === "underline" && AttributeValue === "true") {
            Nodes.push({ Type: "Underline", Children: InnerNodes });
          } else {
            // Unrecognized attribute/value: keep the content rather than lose it.
            Nodes.push(...InnerNodes);
          }
          Index = CloseIndex + "</span>".length;
          continue;
        }
      }

      if (Remainder.startsWith("<br>")) {
        FlushBuffer();
        Nodes.push({ Type: "LineBreak" });
        Index += 4;
        continue;
      }

      const MentionMatch = /^<mention-(user|page|database)\s+url="([^"]*)">(.*?)<\/mention-\1>/.exec(Remainder);
      if (MentionMatch) {
        FlushBuffer();
        const Kind = MentionMatch[1] as "user" | "page" | "database";
        Nodes.push({ Type: "Mention", MentionKind: Kind, Url: MentionMatch[2]!, DisplayText: MentionMatch[3]! });
        Index += MentionMatch[0].length;
        continue;
      }

      const MentionDateMatch = /^<mention-date\s+start="([^"]*)"(?:\s+end="([^"]*)")?\s*\/>/.exec(Remainder);
      if (MentionDateMatch) {
        FlushBuffer();
        Nodes.push({ Type: "Mention", MentionKind: "date", Start: MentionDateMatch[1]!, End: MentionDateMatch[2] ?? null });
        Index += MentionDateMatch[0].length;
        continue;
      }
    }

    if (Text.startsWith("**", Index)) {
      const End = Text.indexOf("**", Index + 2);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Bold", Children: ParseInline(Text.slice(Index + 2, End)) });
        Index = End + 2;
        continue;
      }
    }

    if (Text.startsWith("~~", Index)) {
      const End = Text.indexOf("~~", Index + 2);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Strikethrough", Children: ParseInline(Text.slice(Index + 2, End)) });
        Index = End + 2;
        continue;
      }
    }

    if (Character === "*") {
      const End = Text.indexOf("*", Index + 1);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Italic", Children: ParseInline(Text.slice(Index + 1, End)) });
        Index = End + 1;
        continue;
      }
    }

    if (Character === "[") {
      const CloseBracket = Text.indexOf("]", Index + 1);
      if (CloseBracket !== -1 && Text[CloseBracket + 1] === "(") {
        const CloseParen = Text.indexOf(")", CloseBracket + 2);
        if (CloseParen !== -1) {
          FlushBuffer();
          const LinkText = Text.slice(Index + 1, CloseBracket);
          const Url = Text.slice(CloseBracket + 2, CloseParen);
          Nodes.push({ Type: "Link", Url, Children: ParseInline(LinkText) });
          Index = CloseParen + 1;
          continue;
        }
      }
    }

    Buffer += Character;
    Index += 1;
  }

  FlushBuffer();
  return Nodes;
}
