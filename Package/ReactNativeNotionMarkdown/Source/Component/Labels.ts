/**
 * The user-facing and screen-reader strings the editor's own controls use.
 * The package has no i18n dependency: a consuming app passes translations for
 * any subset, and whatever it leaves out falls back to these English defaults.
 */
export interface NotionMarkdownEditorLabels {
  /** Announced for the toolbar as a whole. */
  readonly Toolbar: string;
  readonly Back: string;
  readonly InsertBlock: string;
  readonly Formatting: string;
  readonly TurnInto: string;
  readonly TextColor: string;
  readonly Bold: string;
  readonly Italic: string;
  readonly Underline: string;
  readonly Strikethrough: string;
  readonly Link: string;
  readonly InlineCode: string;
  readonly Equation: string;
  readonly Indent: string;
  readonly Outdent: string;
  readonly ClosePanel: string;
  readonly DismissKeyboard: string;
  readonly LinkPlaceholder: string;
  readonly LinkConfirm: string;
  /** Announced for a to-do's checkbox. */
  readonly ToDo: string;
  /** The hint on a block that is not being edited. */
  readonly EditBlockHint: string;
  readonly ExpandToggle: string;
  readonly CollapseToggle: string;
}

export const DefaultNotionMarkdownEditorLabels: NotionMarkdownEditorLabels = {
  Toolbar: "Formatting toolbar",
  Back: "Back",
  InsertBlock: "Insert block",
  Formatting: "Formatting",
  TurnInto: "Turn into",
  TextColor: "Text color",
  Bold: "Bold",
  Italic: "Italic",
  Underline: "Underline",
  Strikethrough: "Strikethrough",
  Link: "Link",
  InlineCode: "Inline code",
  Equation: "Equation",
  Indent: "Indent",
  Outdent: "Outdent",
  ClosePanel: "Close panel",
  DismissKeyboard: "Dismiss keyboard",
  LinkPlaceholder: "Paste a link",
  LinkConfirm: "Add",
  ToDo: "To-do",
  EditBlockHint: "Double tap to edit",
  ExpandToggle: "Expand",
  CollapseToggle: "Collapse",
};

export function ResolveNotionMarkdownEditorLabels(Overrides: Partial<NotionMarkdownEditorLabels> | undefined): NotionMarkdownEditorLabels {
  return Overrides === undefined ? DefaultNotionMarkdownEditorLabels : { ...DefaultNotionMarkdownEditorLabels, ...Overrides };
}
