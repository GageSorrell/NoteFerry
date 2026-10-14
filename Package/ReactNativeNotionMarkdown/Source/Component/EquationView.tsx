import * as React from "react";
import { Platform, StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { useNotionMarkdownTheme } from "./Theme.js";

export interface EquationRendererProps {
  readonly Expression: string;
  readonly Inline: boolean;
  readonly Style?: TextStyle | ViewStyle | undefined;
  /** What to show while no typeset result exists yet, and permanently on error. */
  readonly Fallback: React.ReactElement;
}

/** A real math-typesetting implementation, injected by the consuming app — see `EquationViewProps.Renderer`. */
export type EquationRenderer = React.ComponentType<EquationRendererProps>;

export interface EquationViewProps {
  readonly Expression: string;
  /**
   * Inline equations (`$...$`) render as a single `Text` so they can be
   * embedded within a surrounding `Text` tree; block equations (`$$...$$`,
   * the default) render as a standalone `View` with padding.
   */
  readonly Inline?: boolean;
  readonly Style?: TextStyle | ViewStyle;
  /**
   * Optional real math-typesetting implementation, injected by the
   * consuming app (e.g. a WebView + KaTeX component). Undefined renders the
   * zero-config styled-monospace fallback below — the package itself has no
   * math-rendering dependency, matching its Expo-agnostic peer-deps-only
   * posture.
   */
  readonly Renderer?: EquationRenderer | undefined;
}

/**
 * Renders LaTeX source. With no `Renderer`, renders it verbatim (styled as
 * an equation, not evaluated) — the package's zero-config default. With a
 * `Renderer`, hands it the same plain-text element as `Fallback` (shown
 * while loading, and permanently on a render error) and lets it typeset the
 * real thing.
 */
export function EquationView({ Expression, Inline, Style, Renderer }: EquationViewProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  const Fallback = Inline ? (
    <Text style={[Styles.Inline, { backgroundColor: Theme.EquationBackground, color: Theme.EquationText }, Style as TextStyle]}>{Expression}</Text>
  ) : (
    <View style={[Styles.Block, { backgroundColor: Theme.CodeBackground }, Style as ViewStyle]}>
      <Text style={[Styles.BlockText, { color: Theme.CodeText }]}>{Expression}</Text>
    </View>
  );

  if (!Renderer) return Fallback;

  const Rendered = Renderer;
  return <Rendered Expression={Expression} Inline={Boolean(Inline)} Style={Style} Fallback={Fallback} />;
}

const Monospace = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const Styles = StyleSheet.create({
  Inline: {
    fontFamily: Monospace,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  Block: {
    borderRadius: 6,
    padding: 12,
  },
  BlockText: {
    fontFamily: Monospace,
  },
});
