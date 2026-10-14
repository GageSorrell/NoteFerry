/**
 * Development-only Notion Enhanced Markdown showcase for `@noteferry/react-native-notion-markdown`.
 *
 * @module noteferry/app/notion-markdown-lab
 * @internal
 *
 * @file      notion-markdown-lab.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Description, Heading1 } from "@noteferry/ui/Primitive/Text";
import { MakeStyles, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import type {
    BlockKind,
    ColorLabelOverrides,
    IconProps,
    KeyboardAvoidance,
    NotionMarkdownBlockEditorHandle,
    NotionMarkdownTheme,
    ToolbarAction
} from "@noteferry/react-native-notion-markdown";
import {
    NotionMarkdownBlockEditor,
    NotionMarkdownText,
    NotionMarkdownToolbarOutlet,
    NotionMarkdownToolbarProvider
} from "@noteferry/react-native-notion-markdown";
import { LucideIconSet } from "@noteferry/react-native-notion-markdown/LucideIcons";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useRef, useState } from "react";
import Bug from "lucide-react-native/icons/bug";
import { Button } from "@noteferry/ui/Primitive/Button";
import { useTranslation } from "react-i18next";
import { EquationRasterizerProvider } from "../Component/Equation/EquationRasterizerProvider";
import { EquationRenderer } from "../Component/Equation/EquationRenderer";

const InitialMarkdown = `# Notion markdown lab

## Headings and text
### Level 3
#### Level 4

A paragraph with **bold**, *italic*, ~~strike~~, \`code\`, and a [link](https://notion.so).
Colored text: <span color="red">red</span>, <span color="blue_bg">blue background</span>, and <span underline="true">underlined</span>.
An inline equation: $E = mc^2$, repeated to exercise the rasterization
cache: $E = mc^2$ and again $E = mc^2$.
A different inline equation: $a^2 + b^2 = c^2$.
A deliberately malformed inline equation: $\\notarealcommand{x$.
A mention: <mention-user url="u1">Ada Lovelace</mention-user>.

## Lists
- Bulleted item
\t- Nested item
- [ ] Unchecked to-do
- [x] Checked to-do
1. First numbered item
1. Second numbered item

## Quote
> A quoted thought {color="gray"}

## Callout
<callout icon="💡" color="blue_bg">
\tCallouts hold nested blocks, not inline text.
\t- Including lists.
</callout>

## Toggle
<details>
<summary>Click to expand</summary>
\tThis content is collapsed by default.
</details>

## Code
\`\`\`typescript
const milestone = 3;
\`\`\`

## Equation block
$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

---

That's every Milestone 1-3 construct.`;

const InitialEditorMarkdown = `# Editable surface

Type here. Press Enter to split a block, Backspace at the start of an empty
block to remove it, and use the toolbar to format the current selection.
An inline equation: $E = mc^2$.

- A bulleted item
- [ ] A to-do

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$`;

/** Small enough to hit by typing a sentence or two; the app's real page-body limit is 200,000. */
const LabMaxLength = 400;

const BugIcon = ({ Color, Size }: IconProps): React.JSX.Element => <Bug color={ Color } size={ Size } />;

const NotionMarkdownLabScreen = (): React.JSX.Element | null =>
{
    const Styles = useStyles();
    const [ EditorMarkdown, SetEditorMarkdown ] = useState(InitialEditorMarkdown);
    const [ IsDisabled, SetIsDisabled ] = useState(false);
    const [ IsLimited, SetIsLimited ] = useState(false);
    const [ Avoidance, SetAvoidance ] = useState<KeyboardAvoidance>("Host");
    const EditorRef = useRef<NotionMarkdownBlockEditorHandle>(null);
    const Insets = useSafeAreaInsets();
    const Theme = useTheme();
    const { t } = useTranslation("component");

    // The package's `Theme` seam, fed from the app's own semantic tokens so
    // the editor, its toolbar, and its panels follow light/dark mode.
    const EditorTheme: Partial<NotionMarkdownTheme> = useMemo(() => ({
        Accent: Theme.Semantic.Cursor,
        Border: Theme.Semantic.Border,
        CalloutBackground: Theme.Semantic.BackgroundSidebar,
        CodeBackground: Theme.Semantic.BackgroundSidebar,
        CodeText: Theme.Semantic.Primary,
        Control: Theme.Semantic.BackgroundInput,
        InlineCodeBackground: Theme.Semantic.BackgroundInput,
        InlineCodeText: Theme.Semantic.Red,
        Link: Theme.Semantic.Blue,
        MentionBackground: Theme.Semantic.BackgroundInput,
        MutedText: Theme.Semantic.Muted,
        Placeholder: Theme.Semantic.Muted,
        QuoteBorder: Theme.Semantic.Primary,
        Surface: Theme.Semantic.BackgroundMain,
        Text: Theme.Semantic.Primary
    }), [ Theme ]);

    // The package's toolbar-action seam: the app supplies the icon, label,
    // and callback. `Flush()` is what makes the alert show text typed into a
    // block that still has focus.
    const ToolbarActions: readonly ToolbarAction[] = useMemo(() => [ {
        AccessibilityLabel: "Report a bug",
        Icon: BugIcon,
        Key: "ReportBug",
        OnPress: () =>
        {
            const Markdown = EditorRef.current?.Flush() ?? "";
            EditorRef.current?.ClosePanels();
            Alert.alert("Report a bug", `Flushed ${ Markdown.length } characters:\n\n${ Markdown.slice(-200) }`);
        }
    } ], []);

    // The package itself has no i18n dependency (see `ColorSwatchPickerProps`/
    // `BlockTypePickerProps`/`NotionMarkdownBlockEditorProps`'s `*Labels`
    // props) -- this is the demonstration of the app supplying translated
    // strings through that seam. `Resources/*/component.json`'s
    // `notionMarkdown` key is the source of truth for these.
    const BlockTypeLabels: Partial<Record<BlockKind, string>> = useMemo(() => ({
        Paragraph: t("notionMarkdown.blockKinds.paragraph"),
        Heading1: t("notionMarkdown.blockKinds.heading1"),
        Heading2: t("notionMarkdown.blockKinds.heading2"),
        Heading3: t("notionMarkdown.blockKinds.heading3"),
        Heading4: t("notionMarkdown.blockKinds.heading4"),
        BulletedListItem: t("notionMarkdown.blockKinds.bulletedListItem"),
        NumberedListItem: t("notionMarkdown.blockKinds.numberedListItem"),
        ToDo: t("notionMarkdown.blockKinds.toDo"),
        Quote: t("notionMarkdown.blockKinds.quote"),
        Code: t("notionMarkdown.blockKinds.code"),
        Divider: t("notionMarkdown.blockKinds.divider"),
        Callout: t("notionMarkdown.blockKinds.callout"),
        Toggle: t("notionMarkdown.blockKinds.toggle"),
        Equation: t("notionMarkdown.blockKinds.equation")
    }), [ t ]);

    const ColorLabels: ColorLabelOverrides = useMemo(() => ({
        default: t("notionMarkdown.colors.default"),
        gray: t("notionMarkdown.colors.gray"),
        brown: t("notionMarkdown.colors.brown"),
        orange: t("notionMarkdown.colors.orange"),
        yellow: t("notionMarkdown.colors.yellow"),
        green: t("notionMarkdown.colors.green"),
        blue: t("notionMarkdown.colors.blue"),
        purple: t("notionMarkdown.colors.purple"),
        pink: t("notionMarkdown.colors.pink"),
        red: t("notionMarkdown.colors.red")
    }), [ t ]);

    if (!__DEV__)
    {
        return null;
    }

    return (
        <EquationRasterizerProvider>
            <NotionMarkdownToolbarProvider>
                <View style={ Styles.SafeArea }>
                    <ScrollView
                        contentContainerStyle={ Styles.Content }
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={ false }>
                        <View style={ Styles.Header }>
                            <Heading1>Notion markdown lab</Heading1>
                            <Description>
                                Read-only NotionMarkdownText rendering every Milestone 1-3 construct, plus
                                Milestone 6&apos;s real KaTeX equation rendering. Tap a link or mention to
                                see the callback fire.
                            </Description>
                        </View>
                        <View style={ Styles.RenderSurface }>
                            <NotionMarkdownText
                                EquationRenderer={ EquationRenderer }
                                Markdown={ InitialMarkdown }
                                OnLinkPress={ (Url) => Alert.alert("Link pressed", Url) }
                                OnMentionPress={ (Mention) => Alert.alert("Mention pressed", JSON.stringify(Mention)) } />
                        </View>
                        <Body>Markdown length: { InitialMarkdown.length }</Body>

                        <View style={ Styles.Header }>
                            <Heading1>Editable surface</Heading1>
                            <Description>
                                Milestone 4&apos;s NotionMarkdownBlockEditor: tap a block to edit its raw source,
                                Enter to split, Backspace-at-empty to merge upward. Its toolbar is rendered by
                                the outlet pinned below this scroll view, not inside it.
                            </Description>
                        </View>
                        <View style={ Styles.Controls }>
                            <Button
                                OnPress={ () => Alert.alert("Flush()", EditorRef.current?.Flush() ?? "") }
                                Size="Small">
                                Flush
                            </Button>
                            <Button OnPress={ () => SetIsDisabled((Current) => !Current) } Size="Small">
                                { IsDisabled ? "Enable" : "Disable" }
                            </Button>
                            <Button OnPress={ () => SetIsLimited((Current) => !Current) } Size="Small">
                                { IsLimited ? `Limit: ${ LabMaxLength }` : "Limit: off" }
                            </Button>
                            <Button
                                OnPress={ () => SetAvoidance((Current) => Current === "Host" ? "Package" : "Host") }
                                Size="Small">
                                { `Keyboard: ${ Avoidance }` }
                            </Button>
                        </View>
                        <View style={ Styles.RenderSurface }>
                            <NotionMarkdownBlockEditor
                                AccessibilityLabel="Page body"
                                BlockTypeLabels={ BlockTypeLabels }
                                ColorBackgroundSectionLabel={ t("notionMarkdown.colorPicker.backgroundSection") }
                                ColorLabels={ ColorLabels }
                                ColorTextSectionLabel={ t("notionMarkdown.colorPicker.textSection") }
                                Disabled={ IsDisabled }
                                EquationRenderer={ EquationRenderer }
                                Icons={ LucideIconSet }
                                MaxLength={ IsLimited ? LabMaxLength : undefined }
                                OnChange={ SetEditorMarkdown }
                                Placeholder="Write something…"
                                Theme={ EditorTheme }
                                ToolbarActions={ ToolbarActions }
                                ToolbarVisibility="Always"
                                Value={ EditorMarkdown }
                                ref={ EditorRef } />
                        </View>
                        <Body>Editor markdown length (as of the last commit): { EditorMarkdown.length }</Body>
                    </ScrollView>
                    <NotionMarkdownToolbarOutlet BottomInset={ Insets.bottom } KeyboardAvoidance={ Avoidance } />
                </View>
            </NotionMarkdownToolbarProvider>
        </EquationRasterizerProvider>
    );
};

const useStyles = MakeStyles({
    Controls: ViewStyle({
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Token.Spacing.M
    }),
    Content: ViewStyle({
        gap: Token.Spacing.Xl,
        padding: Token.Spacing.Xxl,
        paddingBottom: 64
    }),
    RenderSurface: ViewStyle({
        borderColor: Token.Semantic.Border,
        borderRadius: Token.Radii.Large,
        borderWidth: 1,
        padding: Token.Spacing.L
    }),
    Header: ViewStyle({ gap: Token.Spacing.M }),
    SafeArea: ViewStyle({ flex: 1 })
});

export default NotionMarkdownLabScreen;
