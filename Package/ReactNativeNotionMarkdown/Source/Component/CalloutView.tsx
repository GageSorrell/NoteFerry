import * as React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { ColorValue } from "../Colors.js";
import { ThemedColorStyle, useNotionMarkdownTheme } from "./Theme.js";

export interface CalloutViewProps {
  readonly Icon: string | null;
  readonly Color?: ColorValue | undefined;
  readonly Style?: ViewStyle;
  readonly children?: React.ReactNode;
}

/**
 * A callout's own displayed text has no dedicated prop here, matching
 * `Ast.ts`'s `Callout` block: per Notion's documented format, a callout's
 * body is nested child blocks (typically a leading `Paragraph`), passed in
 * as `children` by the caller, not an inline-text prop on this component.
 */
export function CalloutView({ Icon, Color, Style, children }: CalloutViewProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  const Tint = ThemedColorStyle(Theme, Color);
  return (
    <View style={[Styles.Container, { backgroundColor: Tint.backgroundColor ?? Theme.CalloutBackground }, Style]}>
      {Icon !== null ? <Text style={Styles.Icon}>{Icon}</Text> : null}
      <View style={Styles.Body}>{children}</View>
    </View>
  );
}

const Styles = StyleSheet.create({
  Container: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 6,
    padding: 12,
    gap: 8,
  },
  Icon: {
    fontSize: 18,
    lineHeight: 22,
  },
  Body: {
    flex: 1,
  },
});
