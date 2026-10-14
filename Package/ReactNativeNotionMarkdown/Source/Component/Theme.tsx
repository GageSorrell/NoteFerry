import * as React from "react";
import { ColorStyle, type ColorValue, type NotionColor } from "../Colors.js";

/**
 * Every color the package's components paint with. The defaults reproduce
 * Notion's light palette; a host app overrides any subset (typically from its
 * own design tokens, once per color scheme) through a `Theme` prop.
 */
export interface NotionMarkdownTheme {
  /** Body text, list markers, and toolbar icons. */
  readonly Text: string;
  /** Secondary text: checked to-dos, toggle chevrons, panel section headers. */
  readonly MutedText: string;
  readonly Placeholder: string;
  /** The toolbar and keyboard-panel background. */
  readonly Surface: string;
  /** Toolbar buttons and panel rows, drawn on top of `Surface`. */
  readonly Control: string;
  readonly Border: string;
  /** Caret, text selection, and the selected swatch outline. */
  readonly Accent: string;
  readonly Link: string;
  readonly QuoteBorder: string;
  readonly CodeBackground: string;
  readonly CodeText: string;
  readonly InlineCodeBackground: string;
  readonly InlineCodeText: string;
  readonly CalloutBackground: string;
  readonly EquationBackground: string;
  readonly EquationText: string;
  readonly MentionBackground: string;
  /** Per-color overrides for Notion's nine named colors, e.g. darker `Background` tints for a dark scheme. */
  readonly Colors?: Partial<Record<NotionColor, { readonly Foreground?: string; readonly Background?: string }>> | undefined;
}

export const DefaultNotionMarkdownTheme: NotionMarkdownTheme = {
  Text: "#37352F",
  MutedText: "#9B9A97",
  Placeholder: "#9B9A97",
  Surface: "#FFFFFF",
  Control: "#F1F1EF",
  Border: "#E3E2E0",
  Accent: "#37352F",
  Link: "#337EA9",
  QuoteBorder: "#37352F",
  CodeBackground: "#F7F6F3",
  CodeText: "#37352F",
  InlineCodeBackground: "#F1F1EF",
  InlineCodeText: "#EB5757",
  CalloutBackground: "#F1F1EF",
  EquationBackground: "#F4F2FF",
  EquationText: "#5B4FCF",
  MentionBackground: "#EFEFEF",
};

export function ResolveNotionMarkdownTheme(Overrides: Partial<NotionMarkdownTheme> | undefined): NotionMarkdownTheme {
  return Overrides === undefined ? DefaultNotionMarkdownTheme : { ...DefaultNotionMarkdownTheme, ...Overrides };
}

/** `ColorStyle`, with the theme's per-color overrides applied on top of the default palette. */
export function ThemedColorStyle(Theme: NotionMarkdownTheme, Color: ColorValue | undefined): { color?: string; backgroundColor?: string } {
  const Base = ColorStyle(Color);
  if (Color === undefined || Color === "default" || Theme.Colors === undefined) return Base;
  const IsBackground = Color.endsWith("_bg");
  const Override = Theme.Colors[(IsBackground ? Color.slice(0, -3) : Color) as NotionColor];
  if (Override === undefined) return Base;
  if (IsBackground) return Override.Background !== undefined ? { backgroundColor: Override.Background } : Base;
  return Override.Foreground !== undefined ? { color: Override.Foreground } : Base;
}

const ThemeContext = React.createContext<NotionMarkdownTheme>(DefaultNotionMarkdownTheme);

export const NotionMarkdownThemeProvider = ThemeContext.Provider;

export function useNotionMarkdownTheme(): NotionMarkdownTheme {
  return React.useContext(ThemeContext);
}
