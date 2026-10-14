import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, ByLabel, FindAll, Flat, Inputs, Package, Press, React, Render, Settle, StaticBlocks, TestKeyboard, TextOf, Type } from "./Support/harness.mjs";

const { NotionMarkdownBlockEditor, NotionMarkdownToolbarOutlet, NotionMarkdownToolbarProvider, Parse } = Package;
const h = React.createElement;

afterEach(() => TestKeyboard.Reset());

/** Mounts an editor whose `Value` follows `OnChange`, like a form field would, and records every emission. */
async function Mount(Props = {}, Wrap = (Editor) => Editor) {
  const Ref = React.createRef();
  const Changes = [];
  let SetValue;
  function Host({ Extra }) {
    const [Value, SetValueState] = React.useState(Props.Value ?? "");
    SetValue = SetValueState;
    const OnChange = React.useCallback((Markdown) => {
      Changes.push(Markdown);
      SetValueState(Markdown);
    }, []);
    return Wrap(h(NotionMarkdownBlockEditor, { ...Props, ...Extra, Value, OnChange, ref: Ref }));
  }
  const Rendered = await Render(h(Host, { Extra: {} }));
  return {
    Root: Rendered.root,
    Changes,
    Flush: async () => {
      let Markdown;
      await act(async () => {
        Markdown = Ref.current.Flush();
      });
      return Markdown;
    },
    Handle: () => Ref.current,
    SetProps: (Extra) => Rendered.Update(h(Host, { Extra })),
    ReplaceValue: async (Value) => {
      await act(async () => SetValue(Value));
      await Settle();
    },
  };
}

const FocusBlock = (Root, Index = 0) => Press(StaticBlocks(Root)[Index]);
const Button = (Root, Label) => ByLabel(Root, Label)[0];
const PanelChoice = (Root, Text) => FindAll(Root, (Node) => Node.type === "rn-pressable" && TextOf(Node) === Text)[0];
const ShowKeyboard = (Height) => act(async () => TestKeyboard.Show(Height));

// --- Flush ---------------------------------------------------------------

test("Flush returns the latest keystrokes before the focused input blurs", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "Hello world");

  assert.deepEqual(Editor.Changes, [], "typing alone does not reach OnChange until the block is committed");
  assert.equal(await Editor.Flush(), "Hello world");
  assert.deepEqual(Editor.Changes, ["Hello world"]);
  assert.equal(Inputs(Editor.Root).length, 1, "the block is still being edited after a flush");
});

test("repeated flushes neither lose nor duplicate text, and do not re-emit an unchanged document", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "Hello world");

  assert.equal(await Editor.Flush(), "Hello world");
  assert.equal(await Editor.Flush(), "Hello world");
  assert.equal(await Editor.Flush(), "Hello world");
  assert.deepEqual(Editor.Changes, ["Hello world"]);

  await Type(Editor.Root, "Hello world!");
  assert.equal(await Editor.Flush(), "Hello world!");
  assert.deepEqual(Editor.Changes, ["Hello world", "Hello world!"]);

  // The blur that follows a flush commits the same draft again.
  await act(async () => Inputs(Editor.Root)[0].props.onBlur());
  assert.deepEqual(Editor.Changes, ["Hello world", "Hello world!"]);
  assert.equal(await Editor.Flush(), "Hello world!");
});

test("Flush sees keystrokes that arrived after the last render", async () => {
  const Editor = await Mount({ Value: "a" });
  await FocusBlock(Editor.Root);
  const Handle = Editor.Handle();
  const Stale = Inputs(Editor.Root)[0].props;
  let Markdown;

  // Two native text events and the flush, all before React re-renders: only refs can know about "abc".
  await act(async () => {
    Stale.onChangeText("ab");
    Stale.onChangeText("abc");
    Markdown = Handle.Flush();
  });

  assert.equal(Markdown, "abc");
});

test("Flush returns the whole document, not just the focused block", async () => {
  const Editor = await Mount({ Value: "# Title\n- one\n- two" });
  await FocusBlock(Editor.Root, 2);
  await Type(Editor.Root, "two and more");

  assert.equal(await Editor.Flush(), "# Title\n- one\n- two and more");
});

test("Flush with no block focused returns the document unchanged and emits nothing", async () => {
  const Editor = await Mount({ Value: "# Title\n- one" });
  assert.equal(await Editor.Flush(), "# Title\n- one");
  assert.deepEqual(Editor.Changes, []);
});

test("Flush after Enter includes both halves of the split block and the new block's typing", async () => {
  const Editor = await Mount({ Value: "one" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "on\ne");
  assert.equal(await Editor.Flush(), "on\ne");

  await Type(Editor.Root, "extra");
  assert.equal(await Editor.Flush(), "on\nextra");
});

test("moving straight to another block keeps the first block's uncommitted text", async () => {
  const Editor = await Mount({ Value: "first\nsecond" });
  await FocusBlock(Editor.Root, 0);
  await Type(Editor.Root, "first edited");
  // Index 0 is now an input, so the remaining static block is the second one.
  await FocusBlock(Editor.Root, 0);
  await Type(Editor.Root, "second edited");

  assert.equal(await Editor.Flush(), "first edited\nsecond edited");
});

test("an empty document can be focused and typed into", async () => {
  const Editor = await Mount({ Value: "", Placeholder: "Write something" });
  assert.equal(TextOf(StaticBlocks(Editor.Root)[0]), "Write something");
  assert.equal(await Editor.Flush(), "");

  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "First words");
  assert.equal(await Editor.Flush(), "First words");
});

test("a Value replaced from outside discards the draft of the document it replaced", async () => {
  const Editor = await Mount({ Value: "Old" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "Old and stale");
  await Editor.ReplaceValue("Fresh");

  assert.equal(Inputs(Editor.Root).length, 0);
  assert.equal(await Editor.Flush(), "Fresh");
});

// --- Disabled ------------------------------------------------------------

test("a disabled editor exposes nothing that can modify the document", async () => {
  const Editor = await Mount({ Value: "Text\n- [ ] Task", Disabled: true, ToolbarVisibility: "Always", AccessibilityLabel: "Page body" });

  for (const Block of StaticBlocks(Editor.Root)) {
    assert.equal(Block.props.onPress, undefined);
    assert.equal(Block.props.accessibilityState.disabled, true);
  }
  const Checkbox = FindAll(Editor.Root, (Node) => Node.props.accessibilityRole === "checkbox")[0];
  assert.equal(Checkbox.props.onPress, undefined);
  assert.deepEqual(Checkbox.props.accessibilityState, { checked: false, disabled: true });

  for (const Label of ["Insert block", "Formatting", "Turn into", "Indent", "Outdent"]) {
    assert.equal(Button(Editor.Root, Label).props.onPress, undefined, Label);
    assert.equal(Button(Editor.Root, Label).props.accessibilityState.disabled, true, Label);
  }
  assert.equal(Button(Editor.Root, "Page body").props.accessibilityState.disabled, true);

  await Press(StaticBlocks(Editor.Root)[0]);
  await Press(Checkbox);
  assert.equal(Inputs(Editor.Root).length, 0);
  assert.equal(await Editor.Flush(), "Text\n- [ ] Task");
  assert.deepEqual(Editor.Changes, []);
});

test("disabling the editor mid-edit keeps what was typed and ends editing", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "Hello world");
  const Stale = Inputs(Editor.Root)[0].props;
  await Editor.SetProps({ Disabled: true });

  assert.equal(Inputs(Editor.Root).length, 0);
  assert.deepEqual(Editor.Changes, ["Hello world"]);

  // A late native event from the input that was just removed is ignored.
  await act(async () => Stale.onChangeText("Hello world, tampered"));
  assert.equal(await Editor.Flush(), "Hello world");
});

test("a to-do can be checked while enabled, and reports its state to assistive technology", async () => {
  const Editor = await Mount({ Value: "- [ ] Task" });
  const Checkbox = () => FindAll(Editor.Root, (Node) => Node.props.accessibilityRole === "checkbox")[0];
  assert.equal(Checkbox().props.accessibilityLabel, "To-do");
  await Press(Checkbox());

  assert.equal(Checkbox().props.accessibilityState.checked, true);
  assert.equal(await Editor.Flush(), "- [x] Task");
});

// --- MaxLength -----------------------------------------------------------

test("MaxLength stops typing at the limit and reports it", async () => {
  let Reached = 0;
  const Editor = await Mount({ Value: "12345", MaxLength: 8, OnMaxLengthReached: () => { Reached += 1; } });
  await FocusBlock(Editor.Root);

  await Type(Editor.Root, "12345678");
  assert.equal(Reached, 0);
  await Type(Editor.Root, "123456789");
  assert.equal(Reached, 1);
  assert.equal(Inputs(Editor.Root)[0].props.value, "12345678", "the input is put back to the accepted text");
  assert.equal(await Editor.Flush(), "12345678");
});

test("MaxLength measures the complete serialized body, not the focused block", async () => {
  // "abc\n- def" is 9 characters: the second block's own text is only 3 of them.
  const Editor = await Mount({ Value: "abc\n- def", MaxLength: 10 });
  await FocusBlock(Editor.Root, 1);

  await Type(Editor.Root, "defg");
  assert.equal(await Editor.Flush(), "abc\n- defg");
  assert.equal((await Editor.Flush()).length, 10);

  await Type(Editor.Root, "defgh");
  assert.equal(await Editor.Flush(), "abc\n- defg");
});

test("MaxLength also refuses structural and formatting edits that would exceed it", async () => {
  const Editor = await Mount({ Value: "abc\n- defg", MaxLength: 10 });
  await FocusBlock(Editor.Root, 1);

  // Enter would add a newline and a second "- " marker.
  await Type(Editor.Root, "de\nfg");
  assert.equal(await Editor.Flush(), "abc\n- defg");

  // Bold would add four asterisks.
  await Press(Button(Editor.Root, "Formatting"));
  await Press(Button(Editor.Root, "Bold"));
  assert.equal(await Editor.Flush(), "abc\n- defg");

  // Indenting would add a tab.
  await Press(Button(Editor.Root, "Indent"));
  assert.equal(await Editor.Flush(), "abc\n- defg");
});

test("a body already over MaxLength can be shortened but not lengthened", async () => {
  const Editor = await Mount({ Value: "0123456789ABCDEF", MaxLength: 10 });
  await FocusBlock(Editor.Root);

  await Type(Editor.Root, "0123456789ABCDEFG");
  assert.equal(await Editor.Flush(), "0123456789ABCDEF");
  await Type(Editor.Root, "0123456789ABCDE");
  assert.equal(await Editor.Flush(), "0123456789ABCDE");
});

// --- Toolbar -------------------------------------------------------------

test("custom toolbar actions sit alongside the formatting controls and report presses", async () => {
  let Pressed = 0;
  const Icon = () => h("rn-text", null, "bug");
  const ToolbarActions = [{ Key: "bug", Icon, AccessibilityLabel: "Report a bug", OnPress: () => { Pressed += 1; } }];
  const Editor = await Mount({ Value: "Hello", ToolbarActions });
  await FocusBlock(Editor.Root);

  assert.equal(ByLabel(Editor.Root, "Report a bug").length, 1);
  assert.equal(ByLabel(Editor.Root, "Insert block").length, 1);
  await Press(Button(Editor.Root, "Report a bug"));
  assert.equal(Pressed, 1);

  // The action stays in place when the toolbar switches to its formatting row, and formatting still works.
  await Press(Button(Editor.Root, "Formatting"));
  assert.equal(ByLabel(Editor.Root, "Report a bug").length, 1);
  await Press(Button(Editor.Root, "Bold"));
  assert.equal(await Editor.Flush(), "Hello****");
});

test("without ToolbarActions the toolbar has only its own controls", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  const Toolbar = Button(Editor.Root, "Formatting toolbar");
  const Labels = FindAll(Toolbar, (Node) => Node.props.accessibilityRole === "button").map((Node) => Node.props.accessibilityLabel);

  assert.deepEqual(Labels, ["Insert block", "Formatting", "Turn into", "Indent", "Outdent", "Dismiss keyboard"]);
});

test("ToolbarVisibility decides whether the toolbar outlives focus; custom actions stay usable either way", async () => {
  let Pressed = 0;
  const ToolbarActions = [{ Key: "bug", Icon: () => null, AccessibilityLabel: "Report a bug", OnPress: () => { Pressed += 1; } }];

  const WhenFocused = await Mount({ Value: "Hello", ToolbarActions });
  assert.equal(ByLabel(WhenFocused.Root, "Formatting toolbar").length, 0);

  const Always = await Mount({ Value: "Hello", ToolbarActions, ToolbarVisibility: "Always" });
  assert.equal(ByLabel(Always.Root, "Formatting toolbar").length, 1);
  assert.equal(Button(Always.Root, "Insert block").props.accessibilityState.disabled, true);
  await Press(Button(Always.Root, "Report a bug"));
  assert.equal(Pressed, 1);

  await FocusBlock(Always.Root);
  assert.equal(Button(Always.Root, "Insert block").props.accessibilityState.disabled, false);
});

test("labels and theme colors come from the host", async () => {
  const Editor = await Mount({
    Value: "Hello",
    ToolbarVisibility: "Always",
    AccessibilityLabel: "Page body",
    Labels: { InsertBlock: "Insérer un bloc", Toolbar: "Barre de mise en forme" },
    Theme: { Surface: "#101010", Control: "#202020", Text: "#FAFAFA" },
  });

  assert.equal(ByLabel(Editor.Root, "Insert block").length, 0);
  assert.equal(Flat(Button(Editor.Root, "Insérer un bloc")).backgroundColor, "#202020");
  assert.equal(Flat(Button(Editor.Root, "Barre de mise en forme")).backgroundColor, "#101010");
  assert.equal(Button(Editor.Root, "Formatting").props.accessibilityLabel, "Formatting", "labels left out stay English");

  const BodyText = FindAll(StaticBlocks(Editor.Root)[0], (Node) => Node.type === "rn-text")[0];
  assert.equal(Flat(BodyText).color, "#FAFAFA");

  await FocusBlock(Editor.Root);
  assert.equal(Inputs(Editor.Root)[0].props.accessibilityLabel, "Page body");
  assert.equal(Flat(Inputs(Editor.Root)[0]).color, "#FAFAFA");
});

// --- Panels --------------------------------------------------------------

test("a block stays in editing while a panel has taken the keyboard's place, and the panel's choice applies to it", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "Draft text");

  // Opening the panel dismisses the keyboard, which blurs the input.
  await Press(Button(Editor.Root, "Turn into"));
  assert.equal(Inputs(Editor.Root).length, 1);
  assert.deepEqual(Editor.Changes, ["Draft text"]);

  await Press(PanelChoice(Editor.Root, "Quote"));
  assert.equal(await Editor.Flush(), "> Draft text");
  assert.equal(PanelChoice(Editor.Root, "Quote"), undefined, "the panel closes after a choice");
});

test("inserting a block adds it after the current one and moves editing to it", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "Hello there");
  await Press(Button(Editor.Root, "Insert block"));
  await Press(PanelChoice(Editor.Root, "Heading 1"));
  await Type(Editor.Root, "Title");

  assert.equal(await Editor.Flush(), "Hello there\n# Title");
});

test("typing a slash opens the block picker, and the slash is not kept as text", async () => {
  const Editor = await Mount({ Value: "" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "/");
  await Settle();
  await Press(PanelChoice(Editor.Root, "To-do"));
  await Type(Editor.Root, "task");

  assert.equal(await Editor.Flush(), "- [ ] task");
  assert.ok(!Editor.Changes.some((Markdown) => Markdown.includes("/")), "the pending slash never reaches OnChange");
});

test("an inserted callout or divider leaves the cursor in a block that can be typed into", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await Press(Button(Editor.Root, "Insert block"));
  await Press(PanelChoice(Editor.Root, "Callout"));
  await Type(Editor.Root, "note");
  await Press(Button(Editor.Root, "Insert block"));
  await Press(PanelChoice(Editor.Root, "Divider"));
  await Type(Editor.Root, "after");

  const Types = Parse(await Editor.Flush()).Blocks.map((Block) => `${Block.Type}@${Block.Depth}`);
  assert.deepEqual(Types, ["Paragraph@0", "Callout@0", "Paragraph@1", "Divider@1", "Paragraph@1"]);
});

test("ClosePanels closes an open panel, commits the block, and does not bring the keyboard back", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "Hello world");
  await Press(Button(Editor.Root, "Insert block"));
  assert.ok(PanelChoice(Editor.Root, "Quote"));

  await act(async () => Editor.Handle().ClosePanels());
  await Settle();

  assert.equal(PanelChoice(Editor.Root, "Quote"), undefined);
  assert.equal(Inputs(Editor.Root).length, 0);
  assert.equal(await Editor.Flush(), "Hello world");
});

test("a link is wrapped around the selection from the link panel", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await act(async () => Inputs(Editor.Root)[0].props.onSelectionChange({ nativeEvent: { selection: { start: 0, end: 5 } } }));
  await Press(Button(Editor.Root, "Link"));

  const LinkInput = ByLabel(Editor.Root, "Link").find((Node) => Node.type === "rn-textinput");
  await act(async () => LinkInput.props.onChangeText("https://notion.so"));
  await Press(PanelChoice(Editor.Root, "Add"));

  assert.equal(await Editor.Flush(), "[Hello](https://notion.so)");
});

test("code blocks keep their line breaks instead of splitting", async () => {
  const Editor = await Mount({ Value: "```js\nconst a = 1;\n```" });
  await FocusBlock(Editor.Root);
  await Type(Editor.Root, "const a = 1;\nconst b = 2;");

  assert.equal(await Editor.Flush(), "```js\nconst a = 1;\nconst b = 2;\n```");
});

// --- Toolbar placement and the keyboard ----------------------------------

const Dock = (Root) => FindAll(Root, (Node) => Node.props.pointerEvents === "box-none")[0];

test("by default the toolbar is an overlay inside the editor, raised by the keyboard height", async () => {
  const Editor = await Mount({ Value: "Hello" });
  await FocusBlock(Editor.Root);
  await ShowKeyboard(280);

  assert.equal(Flat(Dock(Editor.Root)).position, "absolute");
  assert.equal(Flat(Dock(Editor.Root)).bottom, 280);
});

const WithOutlet = (OutletProps) => (Editor) =>
  h(NotionMarkdownToolbarProvider, null,
    h("rn-view", { testID: "body" }, Editor),
    h("rn-view", { testID: "dock" }, h(NotionMarkdownToolbarOutlet, OutletProps)));

const Region = (Root, TestId) => FindAll(Root, (Node) => Node.props.testID === TestId)[0];

test("with an outlet the toolbar renders outside the editor's body, in normal layout flow", async () => {
  const Editor = await Mount({ Value: "Hello" }, WithOutlet({}));
  assert.equal(Region(Editor.Root, "dock").children.length, 0, "the outlet takes no space without a toolbar");

  await FocusBlock(Editor.Root);
  assert.equal(ByLabel(Region(Editor.Root, "body"), "Formatting toolbar").length, 0);
  assert.equal(ByLabel(Region(Editor.Root, "dock"), "Formatting toolbar").length, 1);
  assert.equal(Flat(Dock(Editor.Root)).position, undefined);

  // The outlet's toolbar still drives the editor.
  await Type(Editor.Root, "Hello world");
  await Press(Button(Editor.Root, "Turn into"));
  await Press(PanelChoice(Editor.Root, "Heading 2"));
  assert.equal(await Editor.Flush(), "## Hello world");
});

test("the keyboard offset is applied once: by the package, or not at all when the host already avoids the keyboard", async () => {
  const PackageAvoids = await Mount({ Value: "Hello" }, WithOutlet({ KeyboardAvoidance: "Package" }));
  await FocusBlock(PackageAvoids.Root);
  await ShowKeyboard(280);
  assert.equal(Flat(Dock(PackageAvoids.Root)).marginBottom, 280);
  await act(async () => TestKeyboard.Hide());
  assert.equal(Flat(Dock(PackageAvoids.Root)).marginBottom, 0);

  TestKeyboard.Reset();
  const HostAvoids = await Mount({ Value: "Hello" }, WithOutlet({ KeyboardAvoidance: "Host" }));
  await FocusBlock(HostAvoids.Root);
  await ShowKeyboard(280);
  assert.equal(Flat(Dock(HostAvoids.Root)).marginBottom, 0);
});

test("a keyboard-replacing panel sits at the bottom edge with the keyboard's height, without a keyboard offset", async () => {
  const Editor = await Mount({ Value: "Hello" }, WithOutlet({ KeyboardAvoidance: "Package", BottomInset: 34 }));
  await FocusBlock(Editor.Root);
  await ShowKeyboard(280);
  const Content = () => Dock(Editor.Root).children[0];
  assert.equal(Flat(Content()).paddingBottom, 0, "no safe-area inset while the keyboard covers the bottom edge");

  await Press(Button(Editor.Root, "Insert block"));
  assert.equal(Flat(Dock(Editor.Root)).marginBottom, 0);
  assert.equal(Flat(Content()).paddingBottom, 34);
  const Panel = Content().children[1];
  assert.equal(Flat(Panel).height, 280);
});

test("with ToolbarVisibility Always the outlet keeps the toolbar at the bottom while nothing is focused", async () => {
  const Editor = await Mount({ Value: "Hello", ToolbarVisibility: "Always" }, WithOutlet({ BottomInset: 34 }));

  assert.equal(ByLabel(Region(Editor.Root, "dock"), "Formatting toolbar").length, 1);
  assert.equal(Flat(Dock(Editor.Root)).marginBottom, 0);
  assert.equal(Flat(Dock(Editor.Root).children[0]).paddingBottom, 34);
});
