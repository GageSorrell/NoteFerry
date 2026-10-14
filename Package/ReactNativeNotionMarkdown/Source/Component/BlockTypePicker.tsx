import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlockKinds, type BlockKind } from "../BlockOperations.js";
import { useNotionMarkdownTheme } from "./Theme.js";

const DefaultLabels: Record<BlockKind, string> = {
  Paragraph: "Text",
  Heading1: "Heading 1",
  Heading2: "Heading 2",
  Heading3: "Heading 3",
  Heading4: "Heading 4",
  BulletedListItem: "Bulleted list",
  NumberedListItem: "Numbered list",
  ToDo: "To-do",
  Quote: "Quote",
  Code: "Code",
  Divider: "Divider",
  Callout: "Callout",
  Toggle: "Toggle",
  Equation: "Equation",
};

export interface BlockTypePickerProps {
  readonly OnSelect: (Kind: BlockKind) => void;
  /** Overrides individual block-kind labels; any kind left out falls back to the English default. No dependency on an i18n framework — the consuming app supplies translated strings, e.g. via `react-i18next`. */
  readonly Labels?: Partial<Record<BlockKind, string>> | undefined;
  /** Fills the keyboard replacement region with a scrollable two-column grid. */
  readonly PanelMode?: boolean | undefined;
}

/** The block-type picker shown on typing `/` at the start of a block. */
export function BlockTypePicker({ OnSelect, Labels, PanelMode = false }: BlockTypePickerProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  const Items = BlockKinds.map((Kind) => (
    <Pressable key={Kind} accessibilityRole="button" onPress={() => OnSelect(Kind)} style={[Styles.Row, PanelMode ? [Styles.PanelRow, { backgroundColor: Theme.Control }] : null]}>
      <Text style={[Styles.Label, { color: Theme.Text }]}>{Labels?.[Kind] ?? DefaultLabels[Kind]}</Text>
    </Pressable>
  ));

  if (PanelMode) {
    return <ScrollView contentContainerStyle={Styles.PanelContainer} keyboardShouldPersistTaps="handled">{Items}</ScrollView>;
  }

  return (
    <View style={[Styles.Container, { backgroundColor: Theme.Surface, borderColor: Theme.Border }]}>
      {Items}
    </View>
  );
}

const Styles = StyleSheet.create({
  Container: {
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 4,
  },
  PanelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
  },
  Row: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  PanelRow: {
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    width: "48%",
  },
  Label: {
    fontSize: 15,
  },
});
