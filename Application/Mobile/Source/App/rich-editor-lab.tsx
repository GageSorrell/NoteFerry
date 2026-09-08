/**
 * Development-only rich editor showcase used for native interaction QA.
 *
 * @module noteferry/app/rich-editor-lab
 * @internal
 *
 * @file      rich-editor-lab.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Description, Heading1 } from "@noteferry/ui/Primitive/Text";
import { MakeStyles, Token, ViewStyle } from "@noteferry/ui/Core";
import { RichContentEditor } from "@noteferry/ui/rich-editor";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

const InitialMarkdown = `# Rich editor

Select text and try **bold**, _italic_, <u>underline</u>, ~~strike~~, or a [link](https://notion.so).

- First list item
   - Nested list item
- [ ] Tap this to-do

> A quoted thought

\`\`\`typescript
const milestone = 1;
\`\`\`

---`;

const RichEditorLabScreen = (): React.JSX.Element | null =>
{
    const Styles = useStyles();
    const [ Markdown, SetMarkdown ] = useState(InitialMarkdown);

    if (!__DEV__)
    {
        return null;
    }

    return (
        <SafeAreaView edges={ [ "bottom" ] } style={ Styles.SafeArea }>
            <ScrollView
                contentContainerStyle={ Styles.Content }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={ false }>
                <View style={ Styles.Header }>
                    <Heading1>Rich editor</Heading1>
                    <Description>
                        Native milestone playground. Type / for blocks, press Enter to add a block,
                        and use the contextual toolbar for formatting and structure.
                    </Description>
                </View>
                <View style={ Styles.EditorSurface }>
                    <RichContentEditor
                        AccessibilityLabel="Rich page body"
                        OnChange={ SetMarkdown }
                        Placeholder="Write something, or type / for commands"
                        Value={ Markdown }
                    />
                </View>
                <Body>Markdown length: { Markdown.length }</Body>
            </ScrollView>
        </SafeAreaView>
    );
};

const useStyles = MakeStyles({
    Content: ViewStyle({
        gap: Token.Spacing.Xl,
        padding: Token.Spacing.Xxl,
        paddingBottom: 64
    }),
    EditorSurface: ViewStyle({
        borderColor: Token.Semantic.Border,
        borderRadius: Token.Radii.Large,
        borderWidth: 1,
        padding: Token.Spacing.L
    }),
    Header: ViewStyle({ gap: Token.Spacing.M }),
    SafeArea: ViewStyle({ flex: 1 })
});

export default RichEditorLabScreen;
