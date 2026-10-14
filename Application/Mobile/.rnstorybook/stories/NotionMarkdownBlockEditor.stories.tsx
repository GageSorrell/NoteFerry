/**
 * @module noteferry/Storybook/NotionMarkdownBlockEditor
 * @internal
 *
 * @file      NotionMarkdownBlockEditor.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { NotionMarkdownBlockEditor } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";

const InitialMarkdown = `# Editable surface

Type here. Press Enter to split a block, Backspace at the start of an empty
block to remove it, and use the toolbar to format the current selection.

- A bulleted item
- [ ] A to-do`;

const meta =
    {
        component: NotionMarkdownBlockEditor,
        title: "NotionMarkdown/NotionMarkdownBlockEditor"
    } satisfies Meta<typeof NotionMarkdownBlockEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

// A controlled editable surface, matching the dev-only `notion-markdown-lab.tsx`
// screen's usage. Tap a block to edit its raw Enhanced Markdown source; blurred
// blocks render via NotionMarkdownText.
export const Playground: Story =
    {
        render: () => {
            const [ Value, SetValue ] = useState(InitialMarkdown);
            return <NotionMarkdownBlockEditor OnChange={ SetValue } Placeholder="Write something…" Value={ Value } />;
        }
    };

export const Empty: Story =
    {
        render: () => {
            const [ Value, SetValue ] = useState("");
            return <NotionMarkdownBlockEditor OnChange={ SetValue } Placeholder="Write something…" Value={ Value } />;
        }
    };

// Demonstrates the i18n seam (see `NotionMarkdownBlockEditorProps.BlockTypeLabels` /
// `ColorLabels` / `ColorTextSectionLabel` / `ColorBackgroundSectionLabel`) -- the
// package has no i18n dependency itself, a consuming app supplies this.
export const Localized: Story =
    {
        render: () => {
            const [ Value, SetValue ] = useState(InitialMarkdown);
            return (
                <NotionMarkdownBlockEditor
                    BlockTypeLabels={ { Paragraph: "Texte", Heading1: "Titre 1", Quote: "Citation" } }
                    ColorBackgroundSectionLabel="Arrière-plan"
                    ColorLabels={ { default: "Par défaut", red: "Rouge", blue: "Bleu" } }
                    ColorTextSectionLabel="Texte"
                    OnChange={ SetValue }
                    Placeholder="Écrivez quelque chose…"
                    Value={ Value } />
            );
        }
    };
