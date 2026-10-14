import * as React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  type TextInputSelectionChangeEventData,
  type ViewStyle,
} from "react-native";
import type { Block } from "../Ast.js";
import {
  CanIndentBlock,
  CanOutdentBlock,
  DeleteBlock,
  GetBlockDraftText,
  IndentBlock,
  OutdentBlock,
  SplitBlock,
  ToggleChecked,
  type BlockKind,
} from "../BlockOperations.js";
import { ApplyBlockKind, CommitDraft, FitsMaxLength, ResolveDocument } from "../EditorDocument.js";
import { useNotionMarkdownDocument } from "../Hook/useNotionMarkdownDocument.js";
import { Serialize } from "../Serializer.js";
import { BlockTypePicker } from "./BlockTypePicker.js";
import { CalloutView } from "./CalloutView.js";
import { ColorSwatchPicker, type ColorLabelOverrides } from "./ColorSwatchPicker.js";
import { DividerView } from "./DividerView.js";
import { EquationView, type EquationRenderer } from "./EquationView.js";
import { FormattingToolbar, type ToolbarAction } from "./FormattingToolbar.js";
import { KeyboardToolbarHost, type KeyboardToolbarHostHandle, type KeyboardToolbarPanel } from "./KeyboardToolbarHost.js";
import type { IconSet } from "./Icon/IconSet.js";
import { HeadingStyle, Monospace, RenderInline, Styles as InlineStyles, type InlineRenderContext } from "./InlineRenderer.js";
import { ResolveNotionMarkdownEditorLabels, type NotionMarkdownEditorLabels } from "./Labels.js";
import { NotionMarkdownThemeProvider, ResolveNotionMarkdownTheme, ThemedColorStyle, type NotionMarkdownTheme } from "./Theme.js";
import { ToggleView } from "./ToggleView.js";
import { usePublishedToolbar } from "./ToolbarSlot.js";

/** Imperative access to the editor, obtained through its `ref`. */
export interface NotionMarkdownBlockEditorHandle {
  /**
   * Synchronously commits the block being edited — including keystrokes that
   * have not reached `OnChange` yet, since a block's text is otherwise only
   * committed when it loses focus — and returns the complete Markdown
   * document. The block stays focused, and calling this again without
   * further typing returns the same string and does not call `OnChange`
   * again. Call it before reading the body to submit it or to navigate away.
   */
  readonly Flush: () => string;
  /** Closes the block-type, color, or link panel if one is open, without bringing the keyboard back. */
  readonly ClosePanels: () => void;
  /** Removes focus from the block being edited, committing it. */
  readonly Blur: () => void;
}

export interface NotionMarkdownBlockEditorProps {
  readonly Value: string;
  readonly OnChange: (Markdown: string) => void;
  readonly Placeholder?: string;
  readonly Style?: ViewStyle;
  /** Makes the document read-only: no block can be focused, toggled, or restructured, and the built-in toolbar controls are disabled. */
  readonly Disabled?: boolean | undefined;
  /**
   * The longest complete serialized Markdown document the editor will
   * produce. An edit that would grow the document past it is rejected (and
   * `OnMaxLengthReached` is called); edits that do not grow it always go
   * through, so an over-long `Value` can still be trimmed.
   */
  readonly MaxLength?: number | undefined;
  readonly OnMaxLengthReached?: (() => void) | undefined;
  /** Names the editor for assistive technology, e.g. "Page body". */
  readonly AccessibilityLabel?: string | undefined;
  /** Application-supplied toolbar buttons, shown alongside the formatting controls. Omit for none. */
  readonly ToolbarActions?: readonly ToolbarAction[] | undefined;
  /** `"WhenFocused"` (the default) shows the toolbar only while a block is being edited; `"Always"` keeps it on screen, with block controls disabled until one is. */
  readonly ToolbarVisibility?: "WhenFocused" | "Always" | undefined;
  /** Overrides the toolbar, link-panel, and screen-reader strings; see `NotionMarkdownEditorLabels`. Falls back to English. */
  readonly Labels?: Partial<NotionMarkdownEditorLabels> | undefined;
  /** Color overrides for the editor, its toolbar, and its panels; see `NotionMarkdownTheme`. Falls back to the light default. */
  readonly Theme?: Partial<NotionMarkdownTheme> | undefined;
  /** Overrides the `/`-picker's block-kind labels; see `BlockTypePickerProps.Labels`. Falls back to English. */
  readonly BlockTypeLabels?: Partial<Record<BlockKind, string>> | undefined;
  /** Overrides the color picker's color names; see `ColorSwatchPickerProps.ColorLabels`. Falls back to English. */
  readonly ColorLabels?: ColorLabelOverrides | undefined;
  /** Overrides the color picker's "Text" section header. Falls back to English. */
  readonly ColorTextSectionLabel?: string | undefined;
  /** Overrides the color picker's "Background" section header. Falls back to English. */
  readonly ColorBackgroundSectionLabel?: string | undefined;
  /** Optional real math-typesetting implementation for blurred (non-focused) equation blocks/spans; see `EquationViewProps.Renderer`. Undefined renders the zero-config styled-monospace fallback. */
  readonly EquationRenderer?: EquationRenderer | undefined;
  /** Optional toolbar icon overrides. Unspecified slots use the package's glyph/emoji set. */
  readonly Icons?: Partial<IconSet> | undefined;
  readonly ref?: React.Ref<NotionMarkdownBlockEditorHandle> | undefined;
}

interface Selection {
  readonly start: number;
  readonly end: number;
}

/**
 * A near-invisible sentinel shown (only) as an empty block's displayed
 * value — see `HandleChangeText` for why: Android's `TextInput` does not
 * reliably fire `onKeyPress` for Backspace on an already-empty field, so
 * detecting "Backspace at empty" instead relies on `onChangeText`, which
 * only fires when there's a real character to delete.
 *
 * U+200B ZERO WIDTH SPACE was tried first and confirmed (on-device, Android)
 * not to work for this: with truly zero advance width, the platform cannot
 * distinguish a cursor positioned before it from one positioned after it,
 * so Backspace has nothing to delete regardless of the `selection` prop.
 * U+2007 FIGURE SPACE has real (if narrow) advance width, so the cursor can
 * actually sit after it — and like U+200B it isn't reachable from a normal
 * keyboard, so stripping every occurrence from typed content stays safe.
 */
const EmptyMarker = String.fromCharCode(0x2007); // U+2007 FIGURE SPACE
const EmptyMarkerPattern = new RegExp(EmptyMarker, "g");
const DisplayValue = (Text: string): string => (Text.length === 0 ? EmptyMarker : Text);

/** Code and equation blocks hold raw multi-line source, so Enter adds a line to them instead of splitting them. */
const KeepsNewlines = (Node: Block | undefined): boolean => Node?.Type === "Code" || Node?.Type === "Equation";

/**
 * The editable surface: a block-array editor where the focused block shows
 * its raw Enhanced Markdown source in a plain `TextInput`, and every other
 * block renders read-only (sharing `InlineRenderer.tsx` with
 * `NotionMarkdownText` so both stay visually identical). Enter splits the
 * current block, Backspace-at-empty-start deletes and merges upward, and a
 * `FormattingToolbar` plus `/`-triggered `BlockTypePicker` handle the rest.
 *
 * Every handler reads the document, the focused index, and the draft through
 * refs that are written synchronously, never through the values captured by
 * the last render: native text events can arrive in bursts between renders,
 * and `Flush()` is called from outside the render cycle altogether.
 */
export function NotionMarkdownBlockEditor({
  Value,
  OnChange,
  Placeholder,
  Style,
  Disabled = false,
  MaxLength,
  OnMaxLengthReached,
  AccessibilityLabel,
  ToolbarActions,
  ToolbarVisibility = "WhenFocused",
  Labels,
  Theme: ThemeOverrides,
  BlockTypeLabels,
  ColorLabels,
  ColorTextSectionLabel,
  ColorBackgroundSectionLabel,
  EquationRenderer,
  Icons,
  ref,
}: NotionMarkdownBlockEditorProps): React.ReactElement {
  const { Blocks, Commit, GetBlocks, Revision } = useNotionMarkdownDocument(Value, OnChange);
  const Theme = React.useMemo(() => ResolveNotionMarkdownTheme(ThemeOverrides), [ThemeOverrides]);
  const Label = React.useMemo(() => ResolveNotionMarkdownEditorLabels(Labels), [Labels]);

  const [FocusedIndex, SetFocusedIndexState] = React.useState<number | null>(null);
  const [Draft, SetDraftState] = React.useState("");
  const [Selection, SetSelectionState] = React.useState<Selection>({ start: 0, end: 0 });
  const [PickerIndex, SetPickerIndex] = React.useState<number | null>(null);
  const [LinkDraft, SetLinkDraft] = React.useState<string | null>(null);
  const [BlockPickerMode, SetBlockPickerMode] = React.useState<"set" | "insert">("set");
  // Bumped when an edit is refused, so the native input is re-rendered back to the unchanged draft.
  const [, SetRejectedEdits] = React.useState(0);
  const InputRef = React.useRef<TextInput | null>(null);
  const HostRef = React.useRef<KeyboardToolbarHostHandle | null>(null);

  const FocusedIndexRef = React.useRef<number | null>(null);
  const DraftRef = React.useRef("");
  const SelectionRef = React.useRef<Selection>({ start: 0, end: 0 });
  const PanelRef = React.useRef<KeyboardToolbarPanel>("none");
  const InputFocusedRef = React.useRef(false);

  const SetFocusedIndex = (Next: number | null): void => {
    FocusedIndexRef.current = Next;
    SetFocusedIndexState(Next);
  };
  const SetDraft = (NewDraft: string): void => {
    DraftRef.current = NewDraft;
    SetDraftState(NewDraft);
  };
  const SetSelection = (Next: Selection): void => {
    SelectionRef.current = Next;
    SetSelectionState(Next);
  };

  const ResetOverlays = (): void => {
    SetPickerIndex(null);
    SetLinkDraft(null);
  };

  /** The document including the focused block's uncommitted draft — what every edit is measured and built against. */
  const Resolved = (): readonly Block[] => ResolveDocument(GetBlocks(), FocusedIndexRef.current, DraftRef.current);

  /** Whether moving the document to `Next` respects `MaxLength`; reports and re-renders when it does not. */
  const Allows = (Next: readonly Block[]): boolean => {
    if (FitsMaxLength(Resolved(), Next, MaxLength)) return true;
    OnMaxLengthReached?.();
    SetRejectedEdits((Count) => Count + 1);
    return false;
  };

  const FocusBlockFrom = (SourceBlocks: readonly Block[], Index: number, CursorAtStart: boolean): void => {
    const Text = GetBlockDraftText(SourceBlocks[Index]!);
    SetFocusedIndex(Index);
    SetDraft(Text);
    // Selection offsets index into the *displayed* value, which is
    // `EmptyMarker` (not "") for an empty block — cursor-at-end must land
    // after that marker, or Backspace has nothing before the cursor to
    // delete and the block will look permanently stuck.
    const CursorAt = CursorAtStart ? 0 : DisplayValue(Text).length;
    SetSelection({ start: CursorAt, end: CursorAt });
    ResetOverlays();
    requestAnimationFrame(() => InputRef.current?.focus());
  };

  /** Commits the focused block's draft and stops editing it. */
  const Deactivate = (): void => {
    if (FocusedIndexRef.current === null) return;
    Commit(Resolved());
    SetFocusedIndex(null);
    ResetOverlays();
  };

  const HandleFocusBlock = (Index: number): void => {
    if (Disabled) return;
    // Moving straight from one block to another unmounts the first block's
    // input without a blur event, so its draft is committed here.
    if (FocusedIndexRef.current !== null) Commit(Resolved());
    HostRef.current?.ClosePanel();
    FocusBlockFrom(GetBlocks(), Index, false);
  };

  const HandleBlur = (Index: number): void => {
    InputFocusedRef.current = false;
    if (FocusedIndexRef.current !== Index) return;
    // A `/` that only summoned the block-type picker is not content yet.
    const PendingSlash = DraftRef.current === "/" && PanelRef.current === "blockType";
    Commit(CommitDraft(GetBlocks(), Index, PendingSlash ? "" : DraftRef.current));
    // Opening a panel takes focus away from the input (the keyboard is
    // dismissed, or the link field is focused), but the block is still the
    // one being edited — the panel's choice applies to it.
    if (PanelRef.current !== "none") return;
    SetFocusedIndex(null);
    ResetOverlays();
  };

  const HandlePanelChange = (Next: KeyboardToolbarPanel, Refocus: boolean): void => {
    PanelRef.current = Next;
    if (Next !== "none") return;
    ResetOverlays();
    // Closed without focus coming back (an imperative close, or the user tapped another field): the block is no longer being edited.
    if (!Refocus && !InputFocusedRef.current) Deactivate();
  };

  /**
   * Deletes `Index` and focuses the previous block, if it's an empty block
   * with nothing to merge (see `CanDeleteEmptyBlock`). Returns whether it
   * did anything, so callers can no-op cleanly otherwise.
   *
   * Reliably detecting "Backspace at an already-empty block" on Android has
   * proven genuinely difficult to verify in this environment: on-device
   * testing confirmed `onKeyPress` does not fire for it here, and neither
   * does `onChangeText` for backspacing a lone sentinel character used
   * specifically to force a real text delta (tried with both U+200B and
   * U+2007 — see `EmptyMarker`). Both detection paths are wired in below as
   * a defense-in-depth measure, since it's plausible one or the other fires
   * correctly for a real on-screen keyboard even though neither did for
   * this session's raw-keyevent-injection testing method. Flagged as a
   * residual risk to re-verify against a real device/keyboard.
   */
  const TryMergeEmptyBlock = (Index: number): boolean => {
    const { Blocks: NextBlocks, FocusIndex } = DeleteBlock(GetBlocks(), Index);
    if (FocusIndex === null || FocusIndex === Index) return false; // Nothing to merge into (e.g. this block has children, or is first).
    Commit(NextBlocks);
    FocusBlockFrom(NextBlocks, FocusIndex, false);
    return true;
  };

  const HandleChangeText = (Index: number, RawNewText: string): void => {
    if (Disabled || FocusedIndexRef.current !== Index) return;
    const Current = GetBlocks();
    const WasEmpty = DraftRef.current.length === 0;

    // An empty block's displayed value always includes a trailing sentinel
    // (see `EmptyMarker`/`DisplayValue`), so backspacing "nothing" actually
    // deletes a real character and fires onChangeText with a truly empty
    // string — see `TryMergeEmptyBlock`'s doc comment for why this exists
    // alongside `HandleKeyPress`'s check, not instead of it.
    if (WasEmpty && RawNewText.length === 0 && TryMergeEmptyBlock(Index)) return;

    const NewText = RawNewText.replace(EmptyMarkerPattern, "");

    const NewlineAt = KeepsNewlines(Current[Index]) ? -1 : NewText.indexOf("\n");
    if (NewlineAt !== -1) {
      const Before = NewText.slice(0, NewlineAt);
      const After = NewText.slice(NewlineAt + 1);
      const { Blocks: NextBlocks, FocusIndex } = SplitBlock(Current, Index, Before, After);
      if (!Allows(NextBlocks)) return;
      Commit(NextBlocks);
      SetFocusedIndex(FocusIndex);
      SetDraft(After);
      // See `FocusBlockFrom`: cursor-at-end must land after `EmptyMarker` when `After` is empty.
      const CursorAt = DisplayValue(After).length;
      SetSelection({ start: CursorAt, end: CursorAt });
      ResetOverlays();
      requestAnimationFrame(() => InputRef.current?.focus());
      return;
    }

    if (!Allows(CommitDraft(Current, Index, NewText))) return;

    SetDraft(NewText);
    if (NewText === "/") {
      SetBlockPickerMode("set");
      SetPickerIndex(Index);
    }
    else if (PickerIndex === Index) SetPickerIndex(null);
  };

  /** Applies a structural edit to the document as the user sees it (draft included), provided it fits `MaxLength`. */
  const ApplyToFocused = (Edit: (Base: readonly Block[], Index: number) => readonly Block[]): void => {
    const Index = FocusedIndexRef.current;
    if (Disabled || Index === null) return;
    const Next = Edit(Resolved(), Index);
    if (Allows(Next)) Commit(Next);
  };

  /**
   * Tab/Shift+Tab indent-outdent for external keyboards (soft keyboards
   * rarely send a Tab key at all, so the toolbar buttons are the primary
   * path for that), plus a redundant Backspace-at-empty check — see
   * `TryMergeEmptyBlock`'s doc comment for why both this and
   * `HandleChangeText` attempt it.
   */
  const HandleKeyPress = (Index: number, Event: NativeSyntheticEvent<TextInputKeyPressEventData>): void => {
    if (Disabled || FocusedIndexRef.current !== Index) return;
    if (Event.nativeEvent.key === "Backspace") {
      if (DraftRef.current.length === 0) TryMergeEmptyBlock(Index);
      return;
    }
    if (Event.nativeEvent.key !== "Tab") return;
    const Shifted = "shiftKey" in Event.nativeEvent && (Event.nativeEvent as unknown as { shiftKey?: boolean }).shiftKey === true;
    ApplyToFocused(Shifted ? OutdentBlock : IndentBlock);
  };

  const HandleSelectionChange = (Event: NativeSyntheticEvent<TextInputSelectionChangeEventData>): void => {
    SetSelection(Event.nativeEvent.selection);
  };

  const ApplyWrap = (Prefix: string, Suffix: string): void => {
    const Index = FocusedIndexRef.current;
    if (Disabled || Index === null) return;
    const CurrentDraft = DraftRef.current;
    const { start, end } = SelectionRef.current;
    const Before = CurrentDraft.slice(0, start);
    const Middle = CurrentDraft.slice(start, end);
    const After = CurrentDraft.slice(end);
    const NextDraft = Before + Prefix + Middle + Suffix + After;
    if (!Allows(CommitDraft(GetBlocks(), Index, NextDraft))) return;
    SetDraft(NextDraft);
    const CursorAt = Before.length + Prefix.length + Middle.length + Suffix.length;
    SetSelection({ start: CursorAt, end: CursorAt });
  };

  const HandlePickBlockKind = (Kind: BlockKind): void => {
    const Index = FocusedIndexRef.current;
    if (Disabled || Index === null) return;
    // In "set" mode the `/` that opened the picker is a command, not text to keep.
    const DraftText = BlockPickerMode === "set" && DraftRef.current === "/" ? "" : DraftRef.current;
    const Result = ApplyBlockKind(CommitDraft(GetBlocks(), Index, DraftText), Index, Kind, BlockPickerMode);
    SetPickerIndex(null);
    if (!Allows(Result.Blocks)) return;
    Commit(Result.Blocks);
    FocusBlockFrom(Result.Blocks, Result.FocusIndex, BlockPickerMode === "insert");
  };

  const HandlePickColor = (Color: string): void => {
    ApplyWrap(`<span color="${Color}">`, "</span>");
  };

  const HandleConfirmLink = (): void => {
    if (LinkDraft !== null && LinkDraft.length > 0) ApplyWrap("[", `](${LinkDraft})`);
    SetLinkDraft(null);
  };

  const HandleToggleChecked = (Index: number): void => {
    if (Disabled) return;
    Commit(ToggleChecked(Resolved(), Index));
  };

  // An externally replaced `Value` (anything but an echo of this editor's own
  // output) is a different document: block indexes and the draft no longer
  // refer to it, so editing stops without committing the stale draft.
  React.useEffect(() => {
    if (Revision === 0 || FocusedIndexRef.current === null) return;
    SetFocusedIndex(null);
    SetDraft("");
    ResetOverlays();
    HostRef.current?.ClosePanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Revision]);

  React.useEffect(() => {
    if (!Disabled) return;
    HostRef.current?.ClosePanel();
    Deactivate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Disabled]);

  const Latest = React.useRef({ Commit, GetBlocks, Deactivate });
  Latest.current = { Commit, GetBlocks, Deactivate };

  React.useImperativeHandle(ref, (): NotionMarkdownBlockEditorHandle => ({
    Flush: () => {
      const { Commit: CommitNow, GetBlocks: GetBlocksNow } = Latest.current;
      const Index = FocusedIndexRef.current;
      if (Index === null) return Serialize({ Blocks: GetBlocksNow() });
      return CommitNow(CommitDraft(GetBlocksNow(), Index, DraftRef.current));
    },
    ClosePanels: () => HostRef.current?.ClosePanel(),
    Blur: () => {
      InputRef.current?.blur();
      Latest.current.Deactivate();
    },
  }), []);

  const RequestedPanel: KeyboardToolbarPanel = PickerIndex !== null ? "blockType" : LinkDraft !== null ? "link" : "none";

  const Context: InlineRenderContext = { EquationRenderer, Theme, KeyCounter: 0 };
  const IsBlank = Blocks.length === 1 && GetBlockDraftText(Blocks[0]!) === "" && Blocks[0]!.Type === "Paragraph";

  const Rows = RenderGroup(Blocks, { Index: 0 }, -1, {
    FocusedIndex,
    Draft,
    Selection,
    InputRef,
    Placeholder: IsBlank ? Placeholder : undefined,
    Disabled,
    AccessibilityLabel,
    Label,
    Theme,
    OnFocusBlock: HandleFocusBlock,
    OnChangeText: HandleChangeText,
    OnKeyPress: HandleKeyPress,
    OnSelectionChange: HandleSelectionChange,
    OnInputFocus: () => { InputFocusedRef.current = true; },
    OnBlur: HandleBlur,
    OnToggleChecked: HandleToggleChecked,
    Context,
  });

  const BlockControlsDisabled = Disabled || FocusedIndex === null;
  const ShowToolbar = ToolbarVisibility === "Always" || FocusedIndex !== null;

  const ToolbarNode = ShowToolbar ? (
    <NotionMarkdownThemeProvider value={Theme}>
      <KeyboardToolbarHost InputRef={InputRef} OnPanelChange={HandlePanelChange} PanelRequest={RequestedPanel} ref={HostRef} Render={(ToolbarState) => (
        <FormattingToolbar
          Actions={ToolbarActions}
          CanIndent={FocusedIndex !== null && CanIndentBlock(Blocks, FocusedIndex)}
          CanOutdent={FocusedIndex !== null && CanOutdentBlock(Blocks, FocusedIndex)}
          Disabled={BlockControlsDisabled}
          Labels={Label}
          OnBold={() => ApplyWrap("**", "**")}
          OnCode={() => ApplyWrap("`", "`")}
          OnColor={() => ToolbarState.TogglePanel("color")}
          OnDismissKeyboard={ToolbarState.DismissKeyboard}
          OnEquation={() => ApplyWrap("$", "$")}
          OnInsert={() => { SetBlockPickerMode("insert"); SetPickerIndex(FocusedIndex); ToolbarState.OpenPanel("blockType"); }}
          OnIndent={() => ApplyToFocused(IndentBlock)}
          OnItalic={() => ApplyWrap("*", "*")}
          OnLink={() => { if (ToolbarState.Panel === "link") { SetLinkDraft(null); ToolbarState.ClosePanel(); } else { SetLinkDraft(""); ToolbarState.OpenPanel("link"); } }}
          OnOutdent={() => ApplyToFocused(OutdentBlock)}
          OnStrikethrough={() => ApplyWrap("~~", "~~")}
          OnTurnInto={() => { SetBlockPickerMode("set"); SetPickerIndex(FocusedIndex); ToolbarState.OpenPanel("blockType"); }}
          OnUnderline={() => ApplyWrap('<span underline="true">', "</span>")}
          OnClosePanel={() => { ResetOverlays(); ToolbarState.ClosePanel(); }}
          HasSelection={Selection.start !== Selection.end}
          Icons={Icons}
          PanelOpen={ToolbarState.Panel !== "none"}
        />
      )} PanelContent={(PanelState) => (
          PanelState.Panel === "blockType" ? <BlockTypePicker OnSelect={(Kind) => { HandlePickBlockKind(Kind); PanelState.ClosePanel(); }} Labels={BlockTypeLabels} PanelMode /> :
          PanelState.Panel === "color" ? <ColorSwatchPicker OnSelect={(Color) => { HandlePickColor(Color); PanelState.ClosePanel(); }} ColorLabels={ColorLabels} TextSectionLabel={ColorTextSectionLabel} BackgroundSectionLabel={ColorBackgroundSectionLabel} PanelMode /> :
          PanelState.Panel === "link" ? (
            <View style={Styles.LinkRow}>
              <TextInput
                accessibilityLabel={Label.Link}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                keyboardType="url"
                onChangeText={SetLinkDraft}
                onSubmitEditing={() => { HandleConfirmLink(); PanelState.ClosePanel(); }}
                placeholder={Label.LinkPlaceholder}
                placeholderTextColor={Theme.Placeholder}
                selectionColor={Theme.Accent}
                style={[Styles.LinkInput, { borderColor: Theme.Border, color: Theme.Text }]}
                value={LinkDraft ?? ""}
              />
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => { HandleConfirmLink(); PanelState.ClosePanel(); }} style={[Styles.LinkConfirm, { backgroundColor: Theme.Control }]}>
                <Text style={{ color: Theme.Text }}>{Label.LinkConfirm}</Text>
              </Pressable>
            </View>
          ) : null
      )} />
    </NotionMarkdownThemeProvider>
  ) : null;

  const ToolbarIsPublished = usePublishedToolbar(ToolbarNode);

  return (
    <NotionMarkdownThemeProvider value={Theme}>
      <View accessibilityLabel={AccessibilityLabel} accessibilityState={{ disabled: Disabled }} style={Style}>
        {Rows}
        {ToolbarIsPublished ? null : ToolbarNode}
      </View>
    </NotionMarkdownThemeProvider>
  );
}

interface RowCallbacks {
  readonly FocusedIndex: number | null;
  readonly Draft: string;
  readonly Selection: Selection;
  readonly InputRef: React.RefObject<TextInput | null>;
  readonly Placeholder?: string | undefined;
  readonly Disabled: boolean;
  readonly AccessibilityLabel?: string | undefined;
  readonly Label: NotionMarkdownEditorLabels;
  readonly Theme: NotionMarkdownTheme;
  readonly OnFocusBlock: (Index: number) => void;
  readonly OnChangeText: (Index: number, Text: string) => void;
  readonly OnKeyPress: (Index: number, Event: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  readonly OnSelectionChange: (Event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
  readonly OnInputFocus: () => void;
  readonly OnBlur: (Index: number) => void;
  readonly OnToggleChecked: (Index: number) => void;
  readonly Context: InlineRenderContext;
}

function RenderGroup(Blocks: readonly Block[], Cursor: { Index: number }, ParentDepth: number, Row: RowCallbacks): React.ReactElement[] {
  const Elements: React.ReactElement[] = [];
  let NumberedIndex = 0;

  while (Cursor.Index < Blocks.length) {
    const Current = Blocks[Cursor.Index]!;
    if (Current.Depth <= ParentDepth) break;
    const Index = Cursor.Index;
    const ChildDepth = Current.Depth;
    Cursor.Index += 1;

    NumberedIndex = Current.Type === "NumberedListItem" ? NumberedIndex + 1 : 0;

    const Children = RenderGroup(Blocks, Cursor, ChildDepth, Row);
    Elements.push(RenderRow(Current, Index, Children, NumberedIndex, Row));
  }

  return Elements;
}

/** Brings the to-do checkbox glyph up to a 44-point touch target. */
const CheckboxHitSlop = { top: 10, bottom: 10, left: 14, right: 8 };

function RenderRow(Node: Block, Index: number, Children: React.ReactElement[], NumberedIndex: number, Row: RowCallbacks): React.ReactElement {
  const Key = String(Index);
  const { Theme } = Row;

  if (Node.Type === "Divider") return <DividerView key={Key} />;
  if (Node.Type === "Callout") {
    return (
      <CalloutView key={Key} Icon={Node.Icon} Color={Node.Color}>
        {Children}
      </CalloutView>
    );
  }

  const IsFocused = Row.FocusedIndex === Index && !Row.Disabled;
  const IsRawSource = Node.Type === "Code" || Node.Type === "Equation";
  const ContentElement = IsFocused ? (
    <TextInput
      accessibilityLabel={Row.AccessibilityLabel}
      multiline
      onBlur={() => Row.OnBlur(Index)}
      onChangeText={(Text) => Row.OnChangeText(Index, Text)}
      onFocus={Row.OnInputFocus}
      onKeyPress={(Event) => Row.OnKeyPress(Index, Event)}
      onSelectionChange={Row.OnSelectionChange}
      ref={Row.InputRef}
      scrollEnabled={false}
      selection={Row.Selection}
      selectionColor={Theme.Accent}
      style={IsRawSource
        ? [Styles.CodeInput, { color: Theme.CodeText }]
        : [InlineStyles.Paragraph, Styles.Input, { color: Theme.Text }, Node.Type === "Heading" ? HeadingStyle(Node.Level) : null]}
      value={DisplayValue(Row.Draft)}
    />
  ) : (
    <Pressable
      accessibilityHint={Row.Disabled ? undefined : Row.Label.EditBlockHint}
      accessibilityState={{ disabled: Row.Disabled }}
      disabled={Row.Disabled}
      onPress={() => Row.OnFocusBlock(Index)}
    >
      <RenderStaticContent Node={Node} Row={Row} />
    </Pressable>
  );

  switch (Node.Type) {
    case "Paragraph":
    case "Heading":
      return (
        <View key={Key}>
          {ContentElement}
          {Children}
        </View>
      );

    case "BulletedListItem":
      return (
        <View key={Key} style={Styles.ListItemRow}>
          <Text style={[Styles.ListMarker, { color: Theme.Text }]}>•</Text>
          <View style={Styles.ListItemBody}>
            {ContentElement}
            {Children}
          </View>
        </View>
      );

    case "NumberedListItem":
      return (
        <View key={Key} style={Styles.ListItemRow}>
          <Text style={[Styles.ListMarker, { color: Theme.Text }]}>{NumberedIndex}.</Text>
          <View style={Styles.ListItemBody}>
            {ContentElement}
            {Children}
          </View>
        </View>
      );

    case "ToDo":
      return (
        <View key={Key} style={Styles.ListItemRow}>
          <Pressable
            accessibilityLabel={Row.Label.ToDo}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: Node.Checked, disabled: Row.Disabled }}
            disabled={Row.Disabled}
            hitSlop={CheckboxHitSlop}
            onPress={() => Row.OnToggleChecked(Index)}
          >
            <Text style={[Styles.ListMarker, { color: Theme.Text }]}>{Node.Checked ? "☑" : "☐"}</Text>
          </Pressable>
          <View style={Styles.ListItemBody}>
            {ContentElement}
            {Children}
          </View>
        </View>
      );

    case "Quote":
      return (
        <View key={Key} style={[Styles.Quote, { borderLeftColor: Theme.QuoteBorder }]}>
          {ContentElement}
          {Children}
        </View>
      );

    case "Code":
      return (
        <View key={Key} style={[Styles.CodeBlock, { backgroundColor: Theme.CodeBackground }]}>
          {ContentElement}
        </View>
      );

    case "Toggle":
      return (
        <ToggleView key={Key} CollapseLabel={Row.Label.CollapseToggle} ExpandLabel={Row.Label.ExpandToggle} Title={ContentElement}>
          {Children}
        </ToggleView>
      );

    case "Equation":
      // The focused branch is a raw `TextInput` showing LaTeX source, so it
      // keeps the monospace code-block chrome; the blurred branch already
      // renders via `EquationView` (below), which supplies its own
      // container styling (and, with a `Renderer`, real typesetting) — an
      // extra `Styles.CodeBlock` wrapper there would double it up.
      return IsFocused ? (
        <View key={Key} style={[Styles.CodeBlock, { backgroundColor: Theme.CodeBackground }]}>
          {ContentElement}
        </View>
      ) : (
        <View key={Key}>{ContentElement}</View>
      );
  }
}

function RenderStaticContent({ Node, Row }: { Node: Exclude<Block, { Type: "Divider" | "Callout" }>; Row: RowCallbacks }): React.ReactElement {
  const { Theme } = Row;
  switch (Node.Type) {
    case "Code":
      return <Text style={[Styles.CodeText, { color: Theme.CodeText }]}>{Node.Text || " "}</Text>;
    case "Equation":
      return <EquationView Expression={Node.Expression || " "} Renderer={Row.Context.EquationRenderer} />;
    default: {
      const Checked = Node.Type === "ToDo" && Node.Checked;
      const IsEmpty = Node.Content.length === 0;
      const ShowPlaceholder = IsEmpty && Row.Placeholder !== undefined;
      const Content = !IsEmpty ? RenderInline(Node.Content, Row.Context) : ShowPlaceholder ? Row.Placeholder : " ";
      return (
        <Text
          style={[
            InlineStyles.Paragraph,
            { color: ShowPlaceholder ? Theme.Placeholder : Theme.Text },
            Node.Type === "Heading" ? HeadingStyle(Node.Level) : null,
            Checked ? [Styles.ToDoChecked, { color: Theme.MutedText }] : null,
            ThemedColorStyle(Theme, Node.Color),
          ]}
        >
          {Content}
        </Text>
      );
    }
  }
}

const Styles = StyleSheet.create({
  ListItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  ListMarker: {
    fontSize: 16,
    lineHeight: 24,
  },
  ListItemBody: {
    flex: 1,
  },
  ToDoChecked: {
    textDecorationLine: "line-through",
  },
  Quote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  CodeBlock: {
    borderRadius: 6,
    padding: 12,
  },
  CodeText: {
    fontFamily: Monospace,
    fontSize: 14,
  },
  Input: {
    padding: 0,
  },
  CodeInput: {
    fontFamily: Monospace,
    fontSize: 14,
    padding: 0,
  },
  LinkRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  LinkInput: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  LinkConfirm: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
