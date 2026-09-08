/**
 * Controlled block editor composed from native enriched Markdown inputs.
 *
 * @module @noteferry/ui/rich-editor/RichContentEditor
 *
 * @file      RichContentEditor.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    EnrichedMarkdownTextInput,
    type EnrichedMarkdownTextInputInstance,
    type StyleState
} from "react-native-enriched-markdown";
import type { MarkdownBlockType, UnsupportedElementDescriptor } from "@noteferry/notion-markdown";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    type ViewStyle
} from "react-native";
import {
    DeleteRichEditorBlock,
    IndentRichEditorBlock,
    InsertRichEditorBlock,
    MoveRichEditorBlock,
    RichEditorDocumentFromMarkdown,
    RichEditorDocumentToMarkdown,
    type RichEditorBlock,
    UpdateRichEditorBlock
} from "./State.js";
import { useTheme } from "../ThemeProvider.js";

export interface RichEditorSelection
{
    readonly BlockId: string;
    readonly End: number;
    readonly Start: number;
}

export interface RichContentEditorProps
{
    readonly AccessibilityLabel?: string;
    readonly Disabled?: boolean;
    readonly MaxLength?: number;
    readonly OnBlur?: () => void;
    readonly OnChange: (Markdown: string) => void;
    readonly OnFocus?: () => void;
    readonly OnSelectionChange?: (Selection: RichEditorSelection) => void;
    readonly OnSupportMetadataChange?: (
        UnsupportedElements: ReadonlyArray<UnsupportedElementDescriptor>
    ) => void;
    readonly Placeholder?: string;
    readonly Style?: ViewStyle;
    readonly Value: string;
}

interface BlockTypeOption
{
    readonly Glyph: string;
    readonly Label: string;
    readonly Type: MarkdownBlockType;
}

const BlockTypes: ReadonlyArray<BlockTypeOption> = [
    { Glyph: "T", Label: "Text", Type: "Paragraph" },
    { Glyph: "H1", Label: "Heading 1", Type: "Heading1" },
    { Glyph: "H2", Label: "Heading 2", Type: "Heading2" },
    { Glyph: "H3", Label: "Heading 3", Type: "Heading3" },
    { Glyph: "•", Label: "Bulleted list", Type: "BulletedListItem" },
    { Glyph: "1.", Label: "Numbered list", Type: "NumberedListItem" },
    { Glyph: "☐", Label: "To-do", Type: "ToDo" },
    { Glyph: "❝", Label: "Quote", Type: "Quote" },
    { Glyph: "<>" , Label: "Code", Type: "Code" },
    { Glyph: "—", Label: "Divider", Type: "Divider" }
];
const BlockTypeByType = new Map(BlockTypes.map((Option) => [ Option.Type, Option ] as const));

const EmptyStyleState: StyleState = {
    bold: { isActive: false },
    heading: { isActive: false, level: 1 },
    italic: { isActive: false },
    link: { isActive: false },
    orderedList: { depth: 0, isActive: false },
    spoiler: { isActive: false },
    strikethrough: { isActive: false },
    underline: { isActive: false },
    unorderedList: { depth: 0, isActive: false }
};

const NativeMarkdownForBlock = (Block: RichEditorBlock): string =>
{
    switch (Block.Type)
    {
        case "Heading1": return `# ${Block.Markdown}`;
        case "Heading2": return `## ${Block.Markdown}`;
        case "Heading3": return `### ${Block.Markdown}`;
        default: return Block.Markdown;
    }
};

const MarkdownFromNative = (Type: MarkdownBlockType, Markdown: string): string =>
{
    switch (Type)
    {
        case "Heading1": return Markdown.replace(/^#\s?/u, "");
        case "Heading2": return Markdown.replace(/^##\s?/u, "");
        case "Heading3": return Markdown.replace(/^###\s?/u, "");
        default: return Markdown;
    }
};

const IsListType = (Type: MarkdownBlockType): boolean =>
    Type === "BulletedListItem" || Type === "NumberedListItem" || Type === "ToDo";

interface EditorBlockInputProps
{
    readonly AccessibilityLabel?: string | undefined;
    readonly Block: RichEditorBlock;
    readonly Disabled: boolean;
    readonly OnChange: (Markdown: string) => void;
    readonly OnBlur?: (() => void) | undefined;
    readonly OnDeleteEmpty: () => void;
    readonly OnFocus: () => void;
    readonly OnSlash: () => void;
    readonly OnSubmit: () => void;
    readonly OnSelectionChange: (Start: number, End: number) => void;
    readonly OnStateChange: (State: StyleState) => void;
    readonly Placeholder?: string | undefined;
    readonly Register: (Instance: EnrichedMarkdownTextInputInstance | null) => void;
}

const EditorBlockInput = ({
    AccessibilityLabel,
    Block,
    Disabled,
    OnChange,
    OnBlur,
    OnDeleteEmpty,
    OnFocus,
    OnSlash,
    OnSubmit,
    OnSelectionChange,
    OnStateChange,
    Placeholder,
    Register
}: EditorBlockInputProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Ref = React.useRef<EnrichedMarkdownTextInputInstance>(null);
    const PlainText = React.useRef(Block.Markdown.replace(/[*_~`<>[\]()]/gu, ""));

    return (
        <EnrichedMarkdownTextInput
            { ...(AccessibilityLabel === undefined ? { } : { accessibilityLabel: AccessibilityLabel }) }
            autoCapitalize={ Block.Type === "Code" ? "none" : "sentences" }
            cursorColor={ Theme.Semantic.Cursor }
            defaultValue={ NativeMarkdownForBlock(Block) }
            editable={ !Disabled }
            formatMenuConfig={ { spoiler: { enabled: false } } }
            key={`${Block.Id}:${Block.Type}`}
            markdownStyle={ {
                em: { color: Theme.Semantic.Primary },
                h1: { color: Theme.Semantic.Primary, fontSize: 27, fontWeight: "700" },
                h2: { color: Theme.Semantic.Primary, fontSize: 23, fontWeight: "700" },
                h3: { color: Theme.Semantic.Primary, fontSize: 19, fontWeight: "600" },
                link: { color: Theme.Semantic.Blue, underline: true },
                strong: { color: Theme.Semantic.Primary }
            } }
            multiline={ false }
            { ...(OnBlur === undefined ? { } : { onBlur: OnBlur }) }
            onChangeMarkdown={ (Markdown) => OnChange(MarkdownFromNative(Block.Type, Markdown)) }
            onChangeSelection={ ({ start, end }) => OnSelectionChange(start, end) }
            onChangeState={ OnStateChange }
            onChangeText={ (Value) =>
            {
                PlainText.current = Value;
                if (Value === "/")
                {
                    OnSlash();
                }
            } }
            onFocus={ () =>
            {
                Register(Ref.current);
                OnFocus();
            } }
            onKeyPress={ ({ nativeEvent }) =>
            {
                if (nativeEvent.key === "Enter")
                {
                    OnSubmit();
                    return;
                }
                if (nativeEvent.key === "Backspace" && PlainText.current === "")
                {
                    OnDeleteEmpty();
                }
            } }
            { ...(Placeholder === undefined ? { } : { placeholder: Placeholder }) }
            placeholderTextColor={ Theme.Semantic.Muted }
            ref={ Ref }
            scrollEnabled={ false }
            selectionColor={ Theme.Semantic.Cursor }
            selectionMenuConfig={ { copyAsMarkdown: { enabled: true }, format: { enabled: true } } }
            style={ StyleSheet.flatten([
                Styles.Input,
                { color: Theme.Semantic.Primary },
                Block.Type === "Code" && Styles.CodeInput
            ]) }
        />
    );
};

interface ToolbarButtonProps
{
    readonly Active?: boolean;
    readonly Disabled?: boolean;
    readonly Label: string;
    readonly OnPress: () => void;
    readonly children: React.ReactNode;
}

const ToolbarButton = ({
    Active = false,
    Disabled = false,
    Label,
    OnPress,
    children
}: ToolbarButtonProps): React.JSX.Element =>
{
    const Theme = useTheme();
    return (
        <Pressable
            accessibilityLabel={ Label }
            accessibilityRole="button"
            accessibilityState={ { disabled: Disabled, selected: Active } }
            disabled={ Disabled }
            onPress={ OnPress }
            style={ [
                Styles.ToolbarButton,
                { backgroundColor: Active ? Theme.Semantic.BackgroundInput : "transparent" },
                Disabled && Styles.Disabled
            ] }>
            <Text style={ [ Styles.ToolbarGlyph, { color: Theme.Semantic.IconPrimary } ] }>
                { children }
            </Text>
        </Pressable>
    );
};

/** A controlled Notion-style block editor backed by native enriched Markdown inputs. */
export const RichContentEditor = ({
    AccessibilityLabel,
    Disabled = false,
    MaxLength,
    OnBlur,
    OnChange,
    OnFocus,
    OnSelectionChange,
    OnSupportMetadataChange,
    Placeholder,
    Style,
    Value
}: RichContentEditorProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const IdCounter = React.useRef(0);
    const MakeId = React.useCallback((): string =>
    {
        IdCounter.current += 1;
        return `rich-block-${IdCounter.current}`;
    }, []);
    const [ Initial ] = React.useState(() => RichEditorDocumentFromMarkdown(Value, MakeId));
    const [ Blocks, SetBlocks ] = React.useState(Initial.Blocks);
    const [ ActiveId, SetActiveId ] = React.useState(Initial.Blocks[0]?.Id ?? "");
    const [ StyleStateValue, SetStyleStateValue ] = React.useState<StyleState>(EmptyStyleState);
    const [ PickerVisible, SetPickerVisible ] = React.useState(false);
    const [ LinkVisible, SetLinkVisible ] = React.useState(false);
    const [ LinkText, SetLinkText ] = React.useState("");
    const [ LinkUrl, SetLinkUrl ] = React.useState("");
    const Selection = React.useRef({ End: 0, Start: 0 });
    const InputRefs = React.useRef(new Map<string, EnrichedMarkdownTextInputInstance>());
    const LastEmittedValue = React.useRef(Value);

    React.useEffect(() =>
    {
        OnSupportMetadataChange?.(Initial.UnsupportedElements);
    }, [ Initial.UnsupportedElements, OnSupportMetadataChange ]);

    React.useEffect(() =>
    {
        if (Value === LastEmittedValue.current)
        {
            return;
        }
        const Document = RichEditorDocumentFromMarkdown(Value, MakeId);
        SetBlocks(Document.Blocks);
        SetActiveId(Document.Blocks[0]?.Id ?? "");
        LastEmittedValue.current = Value;
        OnSupportMetadataChange?.(Document.UnsupportedElements);
    }, [ MakeId, OnSupportMetadataChange, Value ]);

    const Commit = React.useCallback((Next: ReadonlyArray<RichEditorBlock>): boolean =>
    {
        const Markdown = RichEditorDocumentToMarkdown(Next);
        if (MaxLength !== undefined && Markdown.length > MaxLength)
        {
            return false;
        }
        SetBlocks(Next);
        LastEmittedValue.current = Markdown;
        OnChange(Markdown);
        return true;
    }, [ MaxLength, OnChange ]);

    const ActiveIndex = Blocks.findIndex((Block) => Block.Id === ActiveId);
    const ActiveBlock = Blocks[ActiveIndex];
    const ActiveInput = (): EnrichedMarkdownTextInputInstance | undefined => InputRefs.current.get(ActiveId);

    const FocusSoon = React.useCallback((Id: string): void =>
    {
        SetActiveId(Id);
        requestAnimationFrame(() => InputRefs.current.get(Id)?.focus());
    }, []);

    const InsertAfter = React.useCallback((
        Id: string,
        Type: MarkdownBlockType = "Paragraph",
        Depth: number = 0
    ): void =>
    {
        let Next = InsertRichEditorBlock(Blocks, Id, MakeId, Type);
        const Index = Next.findIndex((Block) => Block.Id === Id);
        const Inserted = Next[Index + 1];
        if (Inserted && Depth !== 0)
        {
            Next = UpdateRichEditorBlock(Next, Inserted.Id, { Depth });
        }
        if (Commit(Next))
        {
            if (Inserted)
            {
                FocusSoon(Inserted.Id);
            }
        }
    }, [ Blocks, Commit, FocusSoon, MakeId ]);

    const Delete = React.useCallback((Id: string): void =>
    {
        const Index = Blocks.findIndex((Block) => Block.Id === Id);
        const FocusTarget = Blocks[Math.max(0, Index - 1)];
        const Next = DeleteRichEditorBlock(Blocks, Id, MakeId);
        if (Commit(Next))
        {
            FocusSoon(FocusTarget?.Id ?? Next[0]?.Id ?? "");
        }
    }, [ Blocks, Commit, FocusSoon, MakeId ]);

    const OpenPicker = React.useCallback((Id: string): void =>
    {
        SetActiveId(Id);
        SetPickerVisible(true);
    }, []);

    const ChooseType = React.useCallback((Type: MarkdownBlockType): void =>
    {
        const Current = Blocks.find((Block) => Block.Id === ActiveId);
        if (!Current)
        {
            return;
        }
        const WasSlash = Current.Markdown === "/";
        const Next = UpdateRichEditorBlock(Blocks, ActiveId, {
            ...(Type === "ToDo" ? { Checked: Current.Checked ?? false } : { }),
            Depth: IsListType(Type) ? Current.Depth : 0,
            ...(Type === "Code" ? { Language: Current.Language ?? "plain text" } : { }),
            Markdown: WasSlash ? "" : Current.Markdown,
            Type
        });
        if (Commit(Next))
        {
            SetPickerVisible(false);
            requestAnimationFrame(() =>
                InputRefs.current.get(ActiveId)?.setValue(NativeMarkdownForBlock(
                    Next.find((Block) => Block.Id === ActiveId) ?? Current)));
            FocusSoon(ActiveId);
        }
    }, [ ActiveId, Blocks, Commit, FocusSoon ]);

    const ApplyMove = (Direction: -1 | 1): void =>
    {
        Commit(MoveRichEditorBlock(Blocks, ActiveId, Direction));
    };

    const ApplyIndent = (Direction: -1 | 1): void =>
    {
        Commit(IndentRichEditorBlock(Blocks, ActiveId, Direction));
    };

    const OpenLink = (): void =>
    {
        SetLinkText("");
        SetLinkUrl("");
        SetLinkVisible(true);
    };

    const ApplyLink = (): void =>
    {
        const Url = LinkUrl.trim();
        if (Url === "")
        {
            Alert.alert("Link URL required", "Enter a URL before adding the link.");
            return;
        }
        const Input = ActiveInput();
        if (Selection.current.Start === Selection.current.End)
        {
            Input?.insertLink(LinkText.trim() || Url, Url);
        }
        else
        {
            Input?.setLink(Url);
        }
        SetLinkVisible(false);
    };

    return (
        <View
            accessibilityLabel={ AccessibilityLabel }
            style={ [ Styles.Container, Style ] }>
            <View style={ Styles.Blocks }>
                { Blocks.map((Block, Index) =>
                {
                    const IsActive = Block.Id === ActiveId;
                    return (
                        <View
                            key={ Block.Id }
                            style={ [ Styles.BlockRow, { marginLeft: Block.Depth * 18 } ] }>
                            <Pressable
                                accessibilityLabel={ Block.Type === "ToDo" ? "Toggle to-do" : "Change block type" }
                                accessibilityRole="button"
                                disabled={ Disabled }
                                onLongPress={ () => OpenPicker(Block.Id) }
                                onPress={ () =>
                                {
                                    if (Block.Type === "ToDo")
                                    {
                                        Commit(UpdateRichEditorBlock(Blocks, Block.Id, {
                                            Checked: !Block.Checked
                                        }));
                                    }
                                    else
                                    {
                                        OpenPicker(Block.Id);
                                    }
                                } }
                                style={ [ Styles.BlockTypeButton, Disabled && Styles.Disabled ] }>
                                <Text style={ [ Styles.BlockTypeGlyph, { color: Theme.Semantic.IconSecondary } ] }>
                                    { Block.Type === "ToDo" ? (Block.Checked ? "☑" : "☐")
                                        : BlockTypeByType.get(Block.Type)?.Glyph ?? "T" }
                                </Text>
                            </Pressable>
                            { Block.Type === "Divider"
                                ? (
                                    <Pressable
                                        accessibilityLabel="Select divider block"
                                        accessibilityRole="button"
                                        onPress={ () => SetActiveId(Block.Id) }
                                        style={ Styles.DividerHitArea }>
                                        <View style={ [ Styles.Divider, { backgroundColor: Theme.Semantic.Border } ] } />
                                    </Pressable>
                                )
                                : (
                                    <View style={ [
                                        Styles.InputWrap,
                                        Block.Type === "Quote" && {
                                            borderLeftColor: Theme.Semantic.BorderButton,
                                            borderLeftWidth: 3,
                                            paddingLeft: 10
                                        },
                                        Block.Type === "Code" && {
                                            backgroundColor: Theme.Semantic.BackgroundInput,
                                            borderColor: Theme.Semantic.Border,
                                            borderRadius: 6,
                                            borderWidth: 1,
                                            paddingHorizontal: 8
                                        }
                                    ] }>
                                        <EditorBlockInput
                                            AccessibilityLabel={ Index === 0 ? AccessibilityLabel : undefined }
                                            Block={ Block }
                                            Disabled={ Disabled }
                                            OnChange={ (Markdown) =>
                                            {
                                                const Next = UpdateRichEditorBlock(Blocks, Block.Id, { Markdown });
                                                if (!Commit(Next))
                                                {
                                                    InputRefs.current.get(Block.Id)?.setValue(NativeMarkdownForBlock(Block));
                                                }
                                            } }
                                            OnBlur={ OnBlur }
                                            OnDeleteEmpty={ () => Delete(Block.Id) }
                                            OnFocus={ () =>
                                            {
                                                SetActiveId(Block.Id);
                                                OnFocus?.();
                                            } }
                                            OnSelectionChange={ (Start, End) =>
                                            {
                                                Selection.current = { End, Start };
                                                OnSelectionChange?.({ BlockId: Block.Id, End, Start });
                                            } }
                                            OnSlash={ () => OpenPicker(Block.Id) }
                                            OnSubmit={ () => InsertAfter(
                                                Block.Id,
                                                IsListType(Block.Type) ? Block.Type : "Paragraph",
                                                IsListType(Block.Type) ? Block.Depth : 0
                                            ) }
                                            OnStateChange={ SetStyleStateValue }
                                            Placeholder={ Blocks.length === 1 ? Placeholder : undefined }
                                            Register={ (Instance: EnrichedMarkdownTextInputInstance | null) =>
                                            {
                                                if (Instance)
                                                {
                                                    InputRefs.current.set(Block.Id, Instance);
                                                }
                                                else
                                                {
                                                    InputRefs.current.delete(Block.Id);
                                                }
                                            } }
                                        />
                                    </View>
                                ) }
                            { IsActive && !Disabled
                                ? (
                                    <Pressable
                                        accessibilityLabel="Add block below"
                                        accessibilityRole="button"
                                        onPress={ () => InsertAfter(Block.Id) }
                                        style={ Styles.AddButton }>
                                        <Text style={ [ Styles.AddGlyph, { color: Theme.Semantic.IconSecondary } ] }>+</Text>
                                    </Pressable>
                                )
                                : <View style={ Styles.AddButton } /> }
                        </View>
                    );
                }) }
            </View>

            { ActiveBlock && !Disabled
                ? (
                    <ScrollView
                        contentContainerStyle={ Styles.Toolbar }
                        horizontal
                        keyboardShouldPersistTaps="always"
                        showsHorizontalScrollIndicator={ false }
                        style={ [
                            Styles.ToolbarScroll,
                            { borderColor: Theme.Semantic.Border, backgroundColor: Theme.Semantic.BackgroundMain }
                        ] }>
                        <ToolbarButton Label="Choose block type" OnPress={ () => OpenPicker(ActiveId) }>T</ToolbarButton>
                        <ToolbarButton Active={ StyleStateValue.bold.isActive } Label="Bold" OnPress={ () => ActiveInput()?.toggleBold() }>B</ToolbarButton>
                        <ToolbarButton Active={ StyleStateValue.italic.isActive } Label="Italic" OnPress={ () => ActiveInput()?.toggleItalic() }>I</ToolbarButton>
                        <ToolbarButton Active={ StyleStateValue.underline.isActive } Label="Underline" OnPress={ () => ActiveInput()?.toggleUnderline() }>U</ToolbarButton>
                        <ToolbarButton Active={ StyleStateValue.strikethrough.isActive } Label="Strikethrough" OnPress={ () => ActiveInput()?.toggleStrikethrough() }>S̶</ToolbarButton>
                        <ToolbarButton Active={ StyleStateValue.link.isActive } Label="Add link" OnPress={ OpenLink }>↗</ToolbarButton>
                        <ToolbarButton Disabled={ ActiveIndex <= 0 } Label="Move block up" OnPress={ () => ApplyMove(-1) }>↑</ToolbarButton>
                        <ToolbarButton Disabled={ ActiveIndex < 0 || ActiveIndex >= Blocks.length - 1 } Label="Move block down" OnPress={ () => ApplyMove(1) }>↓</ToolbarButton>
                        <ToolbarButton Disabled={ !IsListType(ActiveBlock.Type) } Label="Outdent block" OnPress={ () => ApplyIndent(-1) }>⇤</ToolbarButton>
                        <ToolbarButton Disabled={ !IsListType(ActiveBlock.Type) } Label="Indent block" OnPress={ () => ApplyIndent(1) }>⇥</ToolbarButton>
                        { ActiveBlock.Type === "ToDo"
                            ? <ToolbarButton Label="Toggle to-do" OnPress={ () => Commit(UpdateRichEditorBlock(Blocks, ActiveId, { Checked: !ActiveBlock.Checked })) }>✓</ToolbarButton>
                            : null }
                        <ToolbarButton Label="Delete block" OnPress={ () => Delete(ActiveId) }>×</ToolbarButton>
                    </ScrollView>
                )
                : null }

            <Modal
                animationType="fade"
                onRequestClose={ () => SetPickerVisible(false) }
                transparent
                visible={ PickerVisible }>
                <Pressable
                    accessibilityLabel="Close block picker"
                    accessibilityRole="button"
                    onPress={ () => SetPickerVisible(false) }
                    style={ Styles.ModalBackdrop }>
                    <Pressable
                        accessibilityRole="menu"
                        onPress={ () => undefined }
                        style={ [ Styles.Picker, { backgroundColor: Theme.Semantic.BackgroundModal } ] }>
                        <Text style={ [ Styles.PickerTitle, { color: Theme.Semantic.Primary } ] }>Turn into</Text>
                        { BlockTypes.map((Option) => (
                            <Pressable
                                accessibilityRole="menuitem"
                                key={ Option.Type }
                                onPress={ () => ChooseType(Option.Type) }
                                style={ Styles.PickerRow }>
                                <Text style={ [ Styles.PickerGlyph, { color: Theme.Semantic.IconPrimary } ] }>{ Option.Glyph }</Text>
                                <Text style={ [ Styles.PickerLabel, { color: Theme.Semantic.Primary } ] }>{ Option.Label }</Text>
                            </Pressable>
                        )) }
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                animationType="fade"
                onRequestClose={ () => SetLinkVisible(false) }
                transparent
                visible={ LinkVisible }>
                <View style={ Styles.ModalBackdrop }>
                    <View style={ [ Styles.LinkDialog, { backgroundColor: Theme.Semantic.BackgroundModal } ] }>
                        <Text style={ [ Styles.PickerTitle, { color: Theme.Semantic.Primary } ] }>Add link</Text>
                        { Selection.current.Start === Selection.current.End
                            ? <TextInput
                                accessibilityLabel="Link text"
                                onChangeText={ SetLinkText }
                                placeholder="Text"
                                placeholderTextColor={ Theme.Semantic.Muted }
                                style={ [ Styles.LinkInput, { borderColor: Theme.Semantic.Border, color: Theme.Semantic.Primary } ] }
                                value={ LinkText }
                            />
                            : null }
                        <TextInput
                            accessibilityLabel="Link URL"
                            autoCapitalize="none"
                            autoCorrect={ false }
                            keyboardType="url"
                            onChangeText={ SetLinkUrl }
                            placeholder="https://"
                            placeholderTextColor={ Theme.Semantic.Muted }
                            style={ [ Styles.LinkInput, { borderColor: Theme.Semantic.Border, color: Theme.Semantic.Primary } ] }
                            value={ LinkUrl }
                        />
                        <View style={ Styles.LinkActions }>
                            <Pressable accessibilityRole="button" onPress={ () => SetLinkVisible(false) } style={ Styles.LinkAction }>
                                <Text style={ { color: Theme.Semantic.Secondary } }>Cancel</Text>
                            </Pressable>
                            <Pressable accessibilityRole="button" onPress={ ApplyLink } style={ Styles.LinkAction }>
                                <Text style={ { color: Theme.Semantic.Blue } }>Add</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const Styles = StyleSheet.create({
    AddButton: {
        alignItems: "center",
        height: 30,
        justifyContent: "center",
        width: 24
    },
    AddGlyph: { fontSize: 20, lineHeight: 22 },
    BlockRow: { alignItems: "center", flexDirection: "row", minHeight: 36 },
    BlockTypeButton: { alignItems: "center", height: 30, justifyContent: "center", width: 30 },
    BlockTypeGlyph: { fontSize: 12, fontWeight: "600" },
    Blocks: { gap: 2 },
    CodeInput: { fontFamily: "monospace", fontSize: 14 },
    Container: { minHeight: 192 },
    Disabled: { opacity: 0.4 },
    Divider: { height: StyleSheet.hairlineWidth, width: "100%" },
    DividerHitArea: { flex: 1, justifyContent: "center", minHeight: 36 },
    Input: { fontSize: 16, lineHeight: 24, minHeight: 34, paddingHorizontal: 0, paddingVertical: 4 },
    InputWrap: { flex: 1, minWidth: 0 },
    LinkAction: { paddingHorizontal: 14, paddingVertical: 9 },
    LinkActions: { flexDirection: "row", justifyContent: "flex-end" },
    LinkDialog: { borderRadius: 12, gap: 12, padding: 18, width: "86%" },
    LinkInput: { borderRadius: 6, borderWidth: 1, fontSize: 15, minHeight: 40, paddingHorizontal: 10 },
    ModalBackdrop: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.45)", flex: 1, justifyContent: "center", padding: 24 },
    Picker: { borderRadius: 12, maxHeight: "80%", padding: 12, width: "100%" },
    PickerGlyph: { fontSize: 14, fontWeight: "600", textAlign: "center", width: 32 },
    PickerLabel: { fontSize: 15 },
    PickerRow: { alignItems: "center", flexDirection: "row", minHeight: 42, paddingHorizontal: 6 },
    PickerTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
    Toolbar: { alignItems: "center", gap: 2, paddingHorizontal: 4 },
    ToolbarButton: { alignItems: "center", borderRadius: 5, height: 34, justifyContent: "center", minWidth: 34 },
    ToolbarGlyph: { fontSize: 14, fontWeight: "600" },
    ToolbarScroll: { borderRadius: 7, borderWidth: 1, marginTop: 10, maxHeight: 38 }
});
