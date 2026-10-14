import * as React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useNotionMarkdownTheme } from "./Theme.js";

export interface DividerViewProps {
  readonly Style?: ViewStyle;
}

/** A plain rule for a Notion `---` divider block. */
export function DividerView({ Style }: DividerViewProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  return <View style={[Styles.Divider, { backgroundColor: Theme.Border }, Style]} />;
}

const Styles = StyleSheet.create({
  Divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
});
