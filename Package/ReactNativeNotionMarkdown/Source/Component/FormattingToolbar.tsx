import * as React from "react";
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { DefaultIconSet } from "./Icon/DefaultIconSet.js";
import type { IconComponent, IconSet } from "./Icon/IconSet.js";
import { ResolveNotionMarkdownEditorLabels, type NotionMarkdownEditorLabels } from "./Labels.js";
import { useNotionMarkdownTheme } from "./Theme.js";

/**
 * An application-supplied toolbar button. The package only draws it and
 * reports the press — what it does (navigation included) stays with the app.
 */
export interface ToolbarAction {
  /** Stable identity among the supplied actions. */
  readonly Key: string;
  readonly Icon: IconComponent;
  readonly AccessibilityLabel: string;
  readonly OnPress: () => void;
  readonly Disabled?: boolean | undefined;
}

export interface FormattingToolbarProps {
  readonly OnBold: () => void;
  readonly OnItalic: () => void;
  readonly OnStrikethrough: () => void;
  readonly OnUnderline: () => void;
  readonly OnLink: () => void;
  readonly OnColor: () => void;
  readonly OnCode?: (() => void) | undefined;
  readonly OnEquation?: (() => void) | undefined;
  readonly OnInsert?: (() => void) | undefined;
  readonly OnTurnInto?: (() => void) | undefined;
  readonly OnFormatting?: (() => void) | undefined;
  readonly OnDismissKeyboard?: (() => void) | undefined;
  readonly OnBack?: (() => void) | undefined;
  readonly OnClosePanel?: (() => void) | undefined;
  readonly OnIndent: () => void;
  readonly OnOutdent: () => void;
  readonly CanIndent: boolean;
  readonly CanOutdent: boolean;
  readonly HasSelection?: boolean | undefined;
  readonly PanelOpen?: boolean | undefined;
  /** Disables every built-in control, e.g. while no block is being edited. Application `Actions` keep their own `Disabled` state. */
  readonly Disabled?: boolean | undefined;
  /** Application-supplied buttons, pinned at the trailing edge so they stay visible while the built-in controls scroll. Omit for none. */
  readonly Actions?: readonly ToolbarAction[] | undefined;
  /** Overrides the buttons' accessibility labels; anything left out falls back to English. */
  readonly Labels?: Partial<NotionMarkdownEditorLabels> | undefined;
  readonly Icons?: Partial<IconSet> | undefined;
  readonly Style?: ViewStyle | undefined;
}

/**
 * A row of formatting actions for the currently-focused block. Purely
 * presentational — the actual text splicing (wrapping the current
 * selection in the right Enhanced Markdown syntax) happens in
 * `NotionMarkdownBlockEditor`, which owns the focused `TextInput`'s value
 * and selection.
 */
export function FormattingToolbar({
  OnBold,
  OnItalic,
  OnStrikethrough,
  OnUnderline,
  OnLink,
  OnColor,
  OnCode = () => undefined,
  OnEquation = () => undefined,
  OnInsert = () => undefined,
  OnTurnInto = () => undefined,
  OnFormatting = () => undefined,
  OnDismissKeyboard = () => undefined,
  OnBack = () => undefined,
  OnClosePanel = () => undefined,
  OnIndent,
  OnOutdent,
  CanIndent,
  CanOutdent,
  HasSelection = false,
  PanelOpen = false,
  Disabled = false,
  Actions,
  Labels,
  Icons,
  Style,
}: FormattingToolbarProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  const Label = ResolveNotionMarkdownEditorLabels(Labels);
  const [FormattingExpanded, SetFormattingExpanded] = React.useState(false);
  const Icon = (Name: keyof IconSet): IconComponent => Icons?.[Name] ?? DefaultIconSet[Name];
  const ShowFormatting = !Disabled && (HasSelection || FormattingExpanded);
  const BackAction = (): void => {
    SetFormattingExpanded(false);
    OnBack();
  };

  return (
    <View accessibilityLabel={Label.Toolbar} accessibilityRole="toolbar" style={[Styles.Container, { backgroundColor: Theme.Surface }, Style]}>
      <ScrollView contentContainerStyle={Styles.Row} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={Styles.Scroll}>
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.Back} Icon={Icon("Back")} OnPress={BackAction} /> : null}
        {!ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.InsertBlock} Disabled={Disabled} Icon={Icon("Insert")} OnPress={OnInsert} /> : null}
        {!ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.Formatting} Disabled={Disabled} Icon={Icon("Formatting")} OnPress={() => { SetFormattingExpanded(true); OnFormatting(); }} /> : null}
        {!ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.TurnInto} Disabled={Disabled} Icon={Icon("TurnInto")} OnPress={OnTurnInto} /> : null}
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.TextColor} Icon={Icon("TextColor")} OnPress={OnColor} /> : null}
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.Bold} Icon={Icon("Bold")} OnPress={OnBold} /> : null}
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.Italic} Icon={Icon("Italic")} OnPress={OnItalic} /> : null}
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.Underline} Icon={Icon("Underline")} OnPress={OnUnderline} /> : null}
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.Strikethrough} Icon={Icon("Strikethrough")} OnPress={OnStrikethrough} /> : null}
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.Link} Icon={Icon("Link")} OnPress={OnLink} /> : null}
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.InlineCode} Icon={Icon("Code")} OnPress={OnCode} /> : null}
        {ShowFormatting ? <ToolbarButton AccessibilityLabel={Label.Equation} Icon={Icon("Equation")} OnPress={OnEquation} /> : null}
        <ToolbarButton AccessibilityLabel={Label.Indent} Disabled={Disabled || !CanIndent} Icon={Icon("Indent")} OnPress={OnIndent} />
        <ToolbarButton AccessibilityLabel={Label.Outdent} Disabled={Disabled || !CanOutdent} Icon={Icon("Outdent")} OnPress={OnOutdent} />
        <ToolbarButton AccessibilityLabel={PanelOpen ? Label.ClosePanel : Label.DismissKeyboard} Disabled={Disabled} Icon={Icon(PanelOpen ? "Close" : "DismissKeyboard")} OnPress={PanelOpen ? OnClosePanel : OnDismissKeyboard} />
      </ScrollView>
      {Actions !== undefined && Actions.length > 0 ? (
        <View style={[Styles.Actions, { borderLeftColor: Theme.Border }]}>
          {Actions.map((Action) => (
            <ToolbarButton key={Action.Key} AccessibilityLabel={Action.AccessibilityLabel} Disabled={Action.Disabled} Icon={Action.Icon} OnPress={Action.OnPress} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface ToolbarButtonProps {
  readonly Icon: IconComponent;
  readonly OnPress: () => void;
  readonly AccessibilityLabel: string;
  readonly Disabled?: boolean | undefined;
}

/** Extends the 36-point button to a 44-point touch target without changing the row's layout. */
const ButtonHitSlop = { top: 4, bottom: 4, left: 2, right: 2 };

function ToolbarButton({ Icon, OnPress, AccessibilityLabel, Disabled }: ToolbarButtonProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  return (
    <Pressable
      disabled={Boolean(Disabled)}
      hitSlop={ButtonHitSlop}
      onPress={Disabled ? undefined : OnPress}
      style={[Styles.Button, { backgroundColor: Theme.Control }, Disabled ? Styles.ButtonDisabled : null]}
      accessibilityRole="button"
      accessibilityLabel={AccessibilityLabel}
      accessibilityState={{ disabled: Boolean(Disabled) }}
    >
      <Icon Color={Theme.Text} Size={18} />
    </Pressable>
  );
}

const Styles = StyleSheet.create({
  Container: {
    alignItems: "center",
    flexDirection: "row",
  },
  Scroll: {
    flex: 1,
  },
  Row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  Actions: {
    alignItems: "center",
    borderLeftWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  Button: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    height: 36,
    borderRadius: 6,
  },
  ButtonDisabled: {
    opacity: 0.4,
  },
});
