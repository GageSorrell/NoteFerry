import * as React from "react";
import { StyleSheet, Text, type TextStyle } from "react-native";
import type { MentionNode } from "../Ast.js";
import { useNotionMarkdownTheme } from "./Theme.js";

export interface MentionPillProps {
  readonly Mention: MentionNode;
  readonly OnPress?: ((Mention: MentionNode) => void) | undefined;
  readonly Style?: TextStyle;
}

function FormatDisplayText(Mention: MentionNode): string {
  if (Mention.MentionKind === "date") {
    return Mention.End !== null ? `${Mention.Start} → ${Mention.End}` : Mention.Start;
  }
  return Mention.DisplayText;
}

function IconFor(Mention: MentionNode): string {
  switch (Mention.MentionKind) {
    case "user":
      return "@";
    case "page":
      return "📄";
    case "database":
      return "🗄";
    case "date":
      return "📅";
  }
}

/**
 * Renders a mention as an inline pill. Mentions are render-only in this
 * package (see `Ast.ts`) — there is no authoring path that produces one
 * from typed text, only this display for a mention that already came from
 * Notion. Implemented as a single `Text` (not `View`+`Text`) so it can be
 * embedded inline within a surrounding `Text` tree, which is the one place
 * React Native disallows nesting non-`Text` components.
 */
export function MentionPill({ Mention, OnPress, Style }: MentionPillProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  return (
    <Text style={[DefaultStyles.Pill, { backgroundColor: Theme.MentionBackground, color: Theme.Text }, Style]} onPress={OnPress ? () => OnPress(Mention) : undefined}>
      {IconFor(Mention)} {FormatDisplayText(Mention)}
    </Text>
  );
}

const DefaultStyles = StyleSheet.create({
  Pill: {
    borderRadius: 4,
    paddingHorizontal: 4,
  },
});
