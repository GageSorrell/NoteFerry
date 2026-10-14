import * as React from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useNotionMarkdownTheme } from "./Theme.js";

export interface ToggleViewProps {
  readonly Title: React.ReactNode;
  /** Pass to control collapse state from outside; omit to let ToggleView manage it internally. */
  readonly Collapsed?: boolean;
  readonly DefaultCollapsed?: boolean;
  readonly OnToggleCollapsed?: (Collapsed: boolean) => void;
  /** Announced for the chevron while collapsed; defaults to English. */
  readonly ExpandLabel?: string | undefined;
  /** Announced for the chevron while expanded; defaults to English. */
  readonly CollapseLabel?: string | undefined;
  readonly Style?: ViewStyle;
  readonly children?: React.ReactNode;
}

/**
 * A collapsible toggle block. Collapse state is transient UI state only —
 * per `Ast.ts`, it is never written into the Markdown or the Notion
 * payload, so this component is free to default to collapsed the way
 * Notion itself does.
 */
export function ToggleView({
  Title,
  Collapsed,
  DefaultCollapsed = true,
  OnToggleCollapsed,
  ExpandLabel = "Expand",
  CollapseLabel = "Collapse",
  Style,
  children,
}: ToggleViewProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  const [InternalCollapsed, SetInternalCollapsed] = React.useState(DefaultCollapsed);
  const IsCollapsed = Collapsed ?? InternalCollapsed;

  const HandlePress = (): void => {
    const Next = !IsCollapsed;
    OnToggleCollapsed?.(Next);
    if (Collapsed === undefined) SetInternalCollapsed(Next);
  };

  return (
    <View style={Style}>
      <View style={Styles.Header}>
        <Pressable
          accessibilityLabel={IsCollapsed ? ExpandLabel : CollapseLabel}
          accessibilityRole="button"
          accessibilityState={{ expanded: !IsCollapsed }}
          hitSlop={12}
          onPress={HandlePress}
        >
          <Text style={[Styles.Chevron, { color: Theme.MutedText }]}>{IsCollapsed ? "▶" : "▼"}</Text>
        </Pressable>
        <View style={Styles.Title}>
          {/* Inline text toggles like the chevron does; an element (the editor's own input or pressable row) keeps its own press handling. */}
          {IsInlineText(Title) ? <Text onPress={HandlePress} style={[Styles.TitleText, { color: Theme.Text }]}>{Title}</Text> : Title}
        </View>
      </View>
      {!IsCollapsed ? <View style={Styles.Body}>{children}</View> : null}
    </View>
  );
}

function IsInlineText(Title: React.ReactNode): boolean {
  return typeof Title === "string" || typeof Title === "number" || Array.isArray(Title);
}

const Styles = StyleSheet.create({
  Header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  Chevron: {
    fontSize: 12,
    width: 14,
  },
  Title: {
    flex: 1,
  },
  TitleText: {
    fontSize: 16,
  },
  Body: {
    marginLeft: 20,
  },
});
