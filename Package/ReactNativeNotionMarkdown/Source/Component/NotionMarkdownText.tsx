import * as React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { Block, MentionNode } from "../Ast.js";
import { Parse } from "../Parser.js";
import { CalloutView } from "./CalloutView.js";
import { DividerView } from "./DividerView.js";
import { EquationView, type EquationRenderer } from "./EquationView.js";
import { CreateInlineRenderContext, HeadingStyle, Monospace, RenderInline, Styles as InlineStyles, type InlineRenderContext } from "./InlineRenderer.js";
import { NotionMarkdownThemeProvider, ResolveNotionMarkdownTheme, ThemedColorStyle, type NotionMarkdownTheme } from "./Theme.js";
import { ToggleView } from "./ToggleView.js";

export interface NotionMarkdownTextProps {
  readonly Markdown: string;
  readonly Style?: ViewStyle;
  readonly OnLinkPress?: (Url: string) => void;
  readonly OnMentionPress?: (Mention: MentionNode) => void;
  /** Optional real math-typesetting implementation for both inline and block equations; see `EquationViewProps.Renderer`. Undefined renders the zero-config styled-monospace fallback. */
  readonly EquationRenderer?: EquationRenderer | undefined;
  /** Color overrides, typically from the host app's design tokens; anything left out keeps the light default. */
  readonly Theme?: Partial<NotionMarkdownTheme> | undefined;
}

/**
 * Read-only renderer for Notion Enhanced Markdown. Walks the flat,
 * Depth-tagged `Block` array (see `Ast.ts`) with the same
 * "first-deeper-block-sets-the-sibling-depth" grouping algorithm
 * `NotionBridge.ts` uses to nest Notion's own `children` arrays — here it
 * groups blocks into nested React elements instead. Inline-node rendering
 * is shared with `NotionMarkdownBlockEditor`'s non-focused rows via
 * `InlineRenderer.tsx`.
 */
export function NotionMarkdownText({ Markdown, Style, OnLinkPress, OnMentionPress, EquationRenderer, Theme: ThemeOverrides }: NotionMarkdownTextProps): React.ReactElement {
  const Theme = React.useMemo(() => ResolveNotionMarkdownTheme(ThemeOverrides), [ThemeOverrides]);
  const Elements = React.useMemo(() => {
    const Doc = Parse(Markdown);
    const Context = CreateInlineRenderContext(OnLinkPress, OnMentionPress, EquationRenderer, Theme);
    return RenderBlockGroup(Doc.Blocks, { Index: 0 }, -1, Context);
  }, [Markdown, OnLinkPress, OnMentionPress, EquationRenderer, Theme]);

  return (
    <NotionMarkdownThemeProvider value={Theme}>
      <View style={Style}>{Elements}</View>
    </NotionMarkdownThemeProvider>
  );
}

function RenderBlockGroup(
  Blocks: readonly Block[],
  Cursor: { Index: number },
  ParentDepth: number,
  Context: InlineRenderContext,
): React.ReactElement[] {
  const Elements: React.ReactElement[] = [];
  let NumberedIndex = 0;

  while (Cursor.Index < Blocks.length) {
    const Current = Blocks[Cursor.Index]!;
    if (Current.Depth <= ParentDepth) break;
    const ChildDepth = Current.Depth;
    Cursor.Index += 1;

    NumberedIndex = Current.Type === "NumberedListItem" ? NumberedIndex + 1 : 0;

    const Children = RenderBlockGroup(Blocks, Cursor, ChildDepth, Context);
    Elements.push(RenderBlock(Current, Children, Context, NumberedIndex));
  }

  return Elements;
}

function RenderBlock(Node: Block, Children: React.ReactElement[], Context: InlineRenderContext, NumberedIndex: number): React.ReactElement {
  Context.KeyCounter += 1;
  const Key = String(Context.KeyCounter);
  const Theme = Context.Theme ?? ResolveNotionMarkdownTheme(undefined);
  const TextColor = { color: Theme.Text };

  switch (Node.Type) {
    case "Paragraph":
      return (
        <Text key={Key} style={[InlineStyles.Paragraph, TextColor, ThemedColorStyle(Theme, Node.Color)]}>
          {RenderInline(Node.Content, Context)}
        </Text>
      );

    case "Heading":
      return (
        <Text key={Key} style={[InlineStyles.Paragraph, TextColor, HeadingStyle(Node.Level), ThemedColorStyle(Theme, Node.Color)]}>
          {RenderInline(Node.Content, Context)}
        </Text>
      );

    case "BulletedListItem":
      return (
        <View key={Key} style={Styles.ListItemRow}>
          <Text style={[Styles.ListMarker, TextColor]}>•</Text>
          <View style={Styles.ListItemBody}>
            <Text style={[InlineStyles.Paragraph, TextColor, ThemedColorStyle(Theme, Node.Color)]}>{RenderInline(Node.Content, Context)}</Text>
            {Children}
          </View>
        </View>
      );

    case "NumberedListItem":
      return (
        <View key={Key} style={Styles.ListItemRow}>
          <Text style={[Styles.ListMarker, TextColor]}>{NumberedIndex}.</Text>
          <View style={Styles.ListItemBody}>
            <Text style={[InlineStyles.Paragraph, TextColor, ThemedColorStyle(Theme, Node.Color)]}>{RenderInline(Node.Content, Context)}</Text>
            {Children}
          </View>
        </View>
      );

    case "ToDo":
      return (
        <View key={Key} style={Styles.ListItemRow}>
          <Text style={[Styles.ListMarker, TextColor]}>{Node.Checked ? "☑" : "☐"}</Text>
          <View style={Styles.ListItemBody}>
            <Text style={[InlineStyles.Paragraph, TextColor, Node.Checked ? [Styles.ToDoChecked, { color: Theme.MutedText }] : null, ThemedColorStyle(Theme, Node.Color)]}>
              {RenderInline(Node.Content, Context)}
            </Text>
            {Children}
          </View>
        </View>
      );

    case "Quote":
      return (
        <View key={Key} style={[Styles.Quote, { borderLeftColor: Theme.QuoteBorder }]}>
          <Text style={[InlineStyles.Paragraph, TextColor, ThemedColorStyle(Theme, Node.Color)]}>{RenderInline(Node.Content, Context)}</Text>
          {Children}
        </View>
      );

    case "Code":
      return (
        <View key={Key} style={[Styles.CodeBlock, { backgroundColor: Theme.CodeBackground }]}>
          <Text style={[Styles.CodeText, { color: Theme.CodeText }]}>{Node.Text}</Text>
        </View>
      );

    case "Divider":
      return <DividerView key={Key} />;

    case "Callout":
      return (
        <CalloutView key={Key} Icon={Node.Icon} Color={Node.Color}>
          {Children}
        </CalloutView>
      );

    case "Toggle":
      return (
        <ToggleView key={Key} Title={RenderInline(Node.Content, Context)}>
          {Children}
        </ToggleView>
      );

    case "Equation":
      return <EquationView key={Key} Expression={Node.Expression} Renderer={Context.EquationRenderer} />;
  }
}

const Styles = StyleSheet.create({
  ListItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  ListMarker: {
    fontSize: 16,
    lineHeight: 24,
  },
  ListItemBody: {
    flex: 1,
  },
  ToDoChecked: {
    textDecorationLine: "line-through",
  },
  Quote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  CodeBlock: {
    borderRadius: 6,
    padding: 12,
  },
  CodeText: {
    fontFamily: Monospace,
    fontSize: 14,
  },
});
