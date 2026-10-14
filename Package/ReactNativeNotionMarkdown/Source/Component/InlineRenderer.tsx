import * as React from "react";
import { Platform, StyleSheet, Text, type TextStyle } from "react-native";
import type { HeadingLevel, InlineNode, MentionNode } from "../Ast.js";
import { EquationView, type EquationRenderer } from "./EquationView.js";
import { MentionPill } from "./MentionPill.js";
import { DefaultNotionMarkdownTheme, ThemedColorStyle, type NotionMarkdownTheme } from "./Theme.js";

/**
 * Inline-node rendering shared between the read-only `NotionMarkdownText`
 * and the non-focused rows of `NotionMarkdownBlockEditor` — factored out so
 * both stay visually identical without copy-pasting the walk.
 */

export interface InlineRenderContext {
  readonly OnLinkPress?: ((Url: string) => void) | undefined;
  readonly OnMentionPress?: ((Mention: MentionNode) => void) | undefined;
  readonly EquationRenderer?: EquationRenderer | undefined;
  /** Colors for inline code, links, and Notion's named colors; defaults to the light palette. */
  readonly Theme?: NotionMarkdownTheme | undefined;
  KeyCounter: number;
}

export function CreateInlineRenderContext(
  OnLinkPress?: ((Url: string) => void) | undefined,
  OnMentionPress?: ((Mention: MentionNode) => void) | undefined,
  EquationRendererProp?: EquationRenderer | undefined,
  Theme?: NotionMarkdownTheme | undefined,
): InlineRenderContext {
  return { OnLinkPress, OnMentionPress, EquationRenderer: EquationRendererProp, Theme, KeyCounter: 0 };
}

function NextKey(Context: InlineRenderContext): string {
  Context.KeyCounter += 1;
  return String(Context.KeyCounter);
}

export function RenderInline(Nodes: readonly InlineNode[], Context: InlineRenderContext): React.ReactNode[] {
  return Nodes.map((Node) => RenderInlineNode(Node, Context));
}

function RenderInlineNode(Node: InlineNode, Context: InlineRenderContext): React.ReactNode {
  const Key = NextKey(Context);
  const Theme = Context.Theme ?? DefaultNotionMarkdownTheme;

  switch (Node.Type) {
    case "Text":
      return Node.Text;
    case "Bold":
      return (
        <Text key={Key} style={Styles.Bold}>
          {RenderInline(Node.Children, Context)}
        </Text>
      );
    case "Italic":
      return (
        <Text key={Key} style={Styles.Italic}>
          {RenderInline(Node.Children, Context)}
        </Text>
      );
    case "Strikethrough":
      return (
        <Text key={Key} style={Styles.Strikethrough}>
          {RenderInline(Node.Children, Context)}
        </Text>
      );
    case "Underline":
      return (
        <Text key={Key} style={Styles.Underline}>
          {RenderInline(Node.Children, Context)}
        </Text>
      );
    case "Code":
      return (
        <Text key={Key} style={[Styles.InlineCode, { backgroundColor: Theme.InlineCodeBackground, color: Theme.InlineCodeText }]}>
          {Node.Text}
        </Text>
      );
    case "Link":
      return (
        <Text key={Key} accessibilityRole="link" style={[Styles.Link, { color: Theme.Link }]} onPress={Context.OnLinkPress ? () => Context.OnLinkPress!(Node.Url) : undefined}>
          {RenderInline(Node.Children, Context)}
        </Text>
      );
    case "Color":
      return (
        <Text key={Key} style={ThemedColorStyle(Theme, Node.Color)}>
          {RenderInline(Node.Children, Context)}
        </Text>
      );
    case "Equation":
      return <EquationView key={Key} Expression={Node.Expression} Inline Renderer={Context.EquationRenderer} />;
    case "LineBreak":
      return "\n";
    case "Mention":
      return <MentionPill key={Key} Mention={Node} OnPress={Context.OnMentionPress} />;
  }
}

export function HeadingStyle(Level: HeadingLevel): TextStyle {
  switch (Level) {
    case 1:
      return Styles.Heading1;
    case 2:
      return Styles.Heading2;
    case 3:
      return Styles.Heading3;
    case 4:
      return Styles.Heading4;
  }
}

const Monospace = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

export const Styles = StyleSheet.create({
  Paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#37352F",
  },
  Heading1: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  Heading2: { fontSize: 24, lineHeight: 30, fontWeight: "700" },
  Heading3: { fontSize: 20, lineHeight: 26, fontWeight: "600" },
  Heading4: { fontSize: 18, lineHeight: 24, fontWeight: "600" },
  Bold: { fontWeight: "700" },
  Italic: { fontStyle: "italic" },
  Strikethrough: { textDecorationLine: "line-through" },
  Underline: { textDecorationLine: "underline" },
  InlineCode: {
    fontFamily: Monospace,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  Link: {
    textDecorationLine: "underline",
  },
});

export { Monospace };
