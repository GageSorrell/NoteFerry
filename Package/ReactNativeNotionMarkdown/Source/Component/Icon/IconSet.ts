import type * as React from "react";

export interface IconProps {
  readonly Size?: number | undefined;
  readonly Color?: string | undefined;
}

export type IconComponent = React.ComponentType<IconProps>;

/** The named icon slots used by the editor toolbar. */
export interface IconSet {
  readonly Insert: IconComponent;
  readonly Formatting: IconComponent;
  readonly TurnInto: IconComponent;
  readonly DismissKeyboard: IconComponent;
  readonly Back: IconComponent;
  readonly TextColor: IconComponent;
  readonly Bold: IconComponent;
  readonly Italic: IconComponent;
  readonly Underline: IconComponent;
  readonly Strikethrough: IconComponent;
  readonly Link: IconComponent;
  readonly Code: IconComponent;
  readonly Equation: IconComponent;
  readonly Close: IconComponent;
  readonly Indent: IconComponent;
  readonly Outdent: IconComponent;
}
