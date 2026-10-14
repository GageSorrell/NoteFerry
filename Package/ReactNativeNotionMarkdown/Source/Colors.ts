/**
 * Notion's 9 named colors, each with a `_bg` background variant, per the
 * Enhanced Markdown format (`{color="red"}`, `<span color="red_bg">`).
 *
 * https://developers.notion.com/guides/data-apis/enhanced-markdown
 *
 * Note this `_bg` suffix is the *markdown* format's shorthand. Notion's REST
 * API (`@notionhq/client`'s `ApiColor`) spells the same thing with a full
 * `_background` suffix — `NotionBridge.ts` converts between the two.
 */

export const NotionColors = [
  "gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red",
] as const;

export type NotionColor = (typeof NotionColors)[number];

export type ColorValue = "default" | NotionColor | `${NotionColor}_bg`;

const ColorValueSet: ReadonlySet<string> = new Set<string>([
  "default",
  ...NotionColors,
  ...NotionColors.map((Color) => `${Color}_bg`),
]);

export function IsColorValue(Value: string): Value is ColorValue {
  return ColorValueSet.has(Value);
}

/**
 * A default visual palette for the 9 colors, used by the read-only renderer
 * and `ColorSwatchPicker`. Callers embedding this package in a design system
 * with its own tokens (e.g. `@noteferry/ui`) can override per-render via the
 * `Style` prop on the affected components — this palette is only a default,
 * not a hard-coded final look.
 */
export interface ColorSwatch {
  readonly Label: string;
  readonly Foreground: string;
  readonly Background: string;
}

const Palette: Record<NotionColor, ColorSwatch> = {
  gray: { Label: "Gray", Foreground: "#787774", Background: "#F1F1EF" },
  brown: { Label: "Brown", Foreground: "#9F6B53", Background: "#F4EEEE" },
  orange: { Label: "Orange", Foreground: "#D9730D", Background: "#FBECDD" },
  yellow: { Label: "Yellow", Foreground: "#CB912F", Background: "#FBF3DB" },
  green: { Label: "Green", Foreground: "#448361", Background: "#EDF3EC" },
  blue: { Label: "Blue", Foreground: "#337EA9", Background: "#E7F3F8" },
  purple: { Label: "Purple", Foreground: "#9065B0", Background: "#F6F3F9" },
  pink: { Label: "Pink", Foreground: "#C14C8A", Background: "#FAF1F5" },
  red: { Label: "Red", Foreground: "#D44C47", Background: "#FDEBEC" },
};

/** The display label for a base color (without its `_bg` variant). */
export function ColorLabel(Color: NotionColor): string {
  return Palette[Color].Label;
}

/** A `Text`/`View`-style-prop fragment (`color` or `backgroundColor`) for a `ColorValue`. */
export function ColorStyle(Color: ColorValue | undefined): { color?: string; backgroundColor?: string } {
  if (Color === undefined || Color === "default") return {};
  const IsBackground = Color.endsWith("_bg");
  const BaseColor = (IsBackground ? Color.slice(0, -3) : Color) as NotionColor;
  const Swatch = Palette[BaseColor];
  return IsBackground ? { backgroundColor: Swatch.Background } : { color: Swatch.Foreground };
}
