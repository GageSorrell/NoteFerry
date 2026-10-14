/**
 * Serializes a `Document` back into Notion's Enhanced Markdown format.
 * Round-trips with `Parser.ts`: `Serialize(Parse(Text))` reproduces `Text`
 * for any input already in canonical form, and `Parse(Serialize(Doc))`
 * reproduces `Doc`.
 *
 * https://developers.notion.com/guides/data-apis/enhanced-markdown
 *
 * Callout and Toggle are the two block types whose closing tag must be
 * emitted after their children (which are just later entries in the flat,
 * Depth-tagged `Blocks` array) — `Serialize` tracks open containers on a
 * stack and closes each one as soon as a later block's `Depth` shows it's
 * no longer nested inside it.
 */

import type { Block, Document, InlineNode } from "./Ast.js";
import type { ColorValue } from "./Colors.js";
import { EscapeText } from "./Escape.js";

function Indent(Depth: number): string {
  return "\t".repeat(Depth);
}

function SerializeTagAttributes(Attributes: Readonly<Record<string, string | undefined>>): string {
  let Result = "";
  for (const [Key, Value] of Object.entries(Attributes)) {
    if (Value !== undefined) Result += ` ${Key}="${Value}"`;
  }
  return Result;
}

function ColorAttributeSuffix(Color: ColorValue | undefined): string {
  return Color !== undefined ? ` {color="${Color}"}` : "";
}

interface OpenContainer {
  readonly Depth: number;
  readonly ClosingTag: string;
}

export function Serialize(Doc: Document): string {
  const Lines: string[] = [];
  const OpenContainers: OpenContainer[] = [];

  const CloseContainersAtOrDeeperThan = (Depth: number): void => {
    while (OpenContainers.length > 0 && OpenContainers[OpenContainers.length - 1]!.Depth >= Depth) {
      const Container = OpenContainers.pop()!;
      Lines.push(Indent(Container.Depth) + Container.ClosingTag);
    }
  };

  for (const Node of Doc.Blocks) {
    CloseContainersAtOrDeeperThan(Node.Depth);
    Lines.push(SerializeBlock(Node));
    if (Node.Type === "Callout") OpenContainers.push({ Depth: Node.Depth, ClosingTag: "</callout>" });
    if (Node.Type === "Toggle") OpenContainers.push({ Depth: Node.Depth, ClosingTag: "</details>" });
  }
  CloseContainersAtOrDeeperThan(-1);

  return Lines.join("\n");
}

function SerializeBlock(Node: Block): string {
  const Prefix = Indent(Node.Depth);

  switch (Node.Type) {
    case "Paragraph":
      return Prefix + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "Heading":
      return Prefix + "#".repeat(Node.Level) + " " + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "BulletedListItem":
      return Prefix + "- " + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "NumberedListItem":
      return Prefix + "1. " + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "ToDo":
      return Prefix + `- [${Node.Checked ? "x" : " "}] ` + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "Quote":
      return Prefix + "> " + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "Code":
      return Prefix + "```" + (Node.Language ?? "") + "\n" + Node.Text + "\n" + Prefix + "```";
    case "Divider":
      return Prefix + "---";
    case "Callout":
      return Prefix + `<callout${SerializeTagAttributes({ icon: Node.Icon ?? undefined, color: Node.Color })}>`;
    case "Toggle":
      return (
        Prefix +
        `<details${SerializeTagAttributes({ color: Node.Color })}>\n` +
        Prefix +
        `<summary>${SerializeInline(Node.Content)}</summary>`
      );
    case "Equation":
      return Prefix + "$$\n" + Node.Expression + "\n" + Prefix + "$$";
  }
}

export function SerializeInline(Nodes: readonly InlineNode[]): string {
  return Nodes.map(SerializeInlineNode).join("");
}

function SerializeInlineNode(Node: InlineNode): string {
  switch (Node.Type) {
    case "Text":
      return EscapeText(Node.Text);
    case "Bold":
      return "**" + SerializeInline(Node.Children) + "**";
    case "Italic":
      return "*" + SerializeInline(Node.Children) + "*";
    case "Strikethrough":
      return "~~" + SerializeInline(Node.Children) + "~~";
    case "Underline":
      return `<span underline="true">${SerializeInline(Node.Children)}</span>`;
    case "Code":
      return "`" + Node.Text + "`";
    case "Link":
      return "[" + SerializeInline(Node.Children) + "](" + Node.Url + ")";
    case "Color":
      return `<span color="${Node.Color}">${SerializeInline(Node.Children)}</span>`;
    case "Equation":
      return "$" + Node.Expression + "$";
    case "LineBreak":
      return "<br>";
    case "Mention":
      if (Node.MentionKind === "date") {
        return Node.End !== null
          ? `<mention-date start="${Node.Start}" end="${Node.End}"/>`
          : `<mention-date start="${Node.Start}"/>`;
      }
      return `<mention-${Node.MentionKind} url="${Node.Url}">${Node.DisplayText}</mention-${Node.MentionKind}>`;
  }
}
