import * as React from "react";
import { Text } from "react-native";
import type { IconComponent, IconProps, IconSet } from "./IconSet.js";

function Glyph({ Value, Size = 18, Color = "#37352F", Bold, Italic, Decoration }: IconProps & { readonly Value: string; readonly Bold?: boolean; readonly Italic?: boolean; readonly Decoration?: "underline" | "line-through" }): React.ReactElement {
  return <Text style={{ color: Color, fontSize: Size, fontStyle: Italic ? "italic" : "normal", fontWeight: Bold ? "700" : "400", textDecorationLine: Decoration }}>{Value}</Text>;
}

const MakeGlyph = (Value: string, Options?: { readonly Bold?: boolean; readonly Italic?: boolean; readonly Decoration?: "underline" | "line-through" }): IconComponent => {
  const Component = (Props: IconProps): React.ReactElement => <Glyph {...Props} Value={Value} {...Options} />;
  Component.displayName = `DefaultIcon(${Value})`;
  return Component;
};

export const DefaultIconSet: IconSet = {
  Insert: MakeGlyph("+", { Bold: true }),
  Formatting: MakeGlyph("Aa"),
  TurnInto: MakeGlyph("↻"),
  DismissKeyboard: MakeGlyph("⌄"),
  Back: MakeGlyph("‹", { Bold: true }),
  TextColor: MakeGlyph("A", { Bold: true }),
  Bold: MakeGlyph("B", { Bold: true }),
  Italic: MakeGlyph("I", { Italic: true }),
  Underline: MakeGlyph("U", { Decoration: "underline" }),
  Strikethrough: MakeGlyph("S", { Decoration: "line-through" }),
  Link: MakeGlyph("🔗"),
  Code: MakeGlyph("</>"),
  Equation: MakeGlyph("√x"),
  Close: MakeGlyph("×", { Bold: true }),
  Indent: MakeGlyph("⇥"),
  Outdent: MakeGlyph("⇤"),
};
