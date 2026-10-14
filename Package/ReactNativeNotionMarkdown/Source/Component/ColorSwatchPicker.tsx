import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ColorLabel, NotionColors, type ColorValue, type NotionColor } from "../Colors.js";
import { ThemedColorStyle, useNotionMarkdownTheme } from "./Theme.js";

/** A color name, keyed the same way `Swatch` derives it — `"default"` or a base `NotionColor` (never a `_bg` variant; text and background swatches for the same color share one label). */
export type ColorLabelOverrides = Partial<Record<"default" | NotionColor, string>>;

export interface ColorSwatchPickerProps {
  readonly Value?: ColorValue;
  readonly OnSelect: (Color: ColorValue) => void;
  /** Overrides individual color names (including `"default"`); any color left out falls back to the English default. No dependency on an i18n framework — the consuming app supplies translated strings, e.g. via `react-i18next`. */
  readonly ColorLabels?: ColorLabelOverrides | undefined;
  /** Overrides the "Text" section header; defaults to English. */
  readonly TextSectionLabel?: string | undefined;
  /** Overrides the "Background" section header; defaults to English. */
  readonly BackgroundSectionLabel?: string | undefined;
  /** Fills the keyboard replacement region with a scrollable two-column grid. */
  readonly PanelMode?: boolean | undefined;
}

/** A two-section (text / background) swatch grid over Notion's 9 colors. */
export function ColorSwatchPicker({
  Value,
  OnSelect,
  ColorLabels,
  TextSectionLabel = "Text",
  BackgroundSectionLabel = "Background",
  PanelMode = false,
}: ColorSwatchPickerProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  const TextColors: ColorValue[] = ["default" as ColorValue, ...NotionColors];
  const BackgroundColors: ColorValue[] = NotionColors.map((Color) => `${Color}_bg` as ColorValue);

  const Content = (
    <>
      <Text style={[Styles.SectionLabel, { color: Theme.MutedText }]}>{TextSectionLabel}</Text>
      <View style={[Styles.Row, PanelMode ? Styles.PanelRow : null]}>
        {TextColors.map((Color) => (
          <Swatch key={Color} Color={Color} Selected={Value === Color} OnSelect={OnSelect} Labels={ColorLabels} PanelMode={PanelMode} />
        ))}
      </View>
      <Text style={[Styles.SectionLabel, { color: Theme.MutedText }]}>{BackgroundSectionLabel}</Text>
      <View style={[Styles.Row, PanelMode ? Styles.PanelRow : null]}>
        {BackgroundColors.map((Color) => (
          <Swatch key={Color} Color={Color} Selected={Value === Color} OnSelect={OnSelect} Labels={ColorLabels} PanelMode={PanelMode} />
        ))}
      </View>
    </>
  );

  return PanelMode ? <ScrollView contentContainerStyle={Styles.PanelContainer} keyboardShouldPersistTaps="handled">{Content}</ScrollView> : <View>{Content}</View>;
}

interface SwatchProps {
  readonly Color: ColorValue;
  readonly Selected: boolean;
  readonly OnSelect: (Color: ColorValue) => void;
  readonly Labels?: ColorLabelOverrides | undefined;
  readonly PanelMode?: boolean | undefined;
}

function Swatch({ Color, Selected, OnSelect, Labels, PanelMode = false }: SwatchProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  const Style = ThemedColorStyle(Theme, Color);
  const BaseColor = (Color.endsWith("_bg") ? Color.slice(0, -3) : Color) as NotionColor | "default";
  const Label = Labels?.[BaseColor] ?? (BaseColor === "default" ? "Default" : ColorLabel(BaseColor));

  return (
    <Pressable
      onPress={() => OnSelect(Color)}
      style={[Styles.Swatch, PanelMode ? Styles.PanelSwatch : null, { backgroundColor: Style.backgroundColor ?? Theme.Surface, borderColor: Theme.Border }, Selected ? [Styles.SwatchSelected, { borderColor: Theme.Accent }] : null]}
      hitSlop={PanelMode ? undefined : 6}
      accessibilityRole="button"
      accessibilityLabel={Label}
      accessibilityState={{ selected: Selected }}
    >
      <Text style={{ color: Style.color ?? Theme.Text }}>A</Text>
    </Pressable>
  );
}

const Styles = StyleSheet.create({
  SectionLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  PanelContainer: {
    padding: 8,
  },
  Row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  PanelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  Swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  PanelSwatch: {
    borderRadius: 8,
    height: 44,
    width: "48%",
  },
  SwatchSelected: {
    borderWidth: 2,
  },
});
