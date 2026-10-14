/**
 * @module noteferry/Storybook/NotionMarkdownBlockTypePicker
 * @internal
 *
 * @file      NotionMarkdownBlockTypePicker.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { BlockTypePicker } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Alert } from "react-native";

const meta =
    {
        component: BlockTypePicker,
        title: "NotionMarkdown/BlockTypePicker"
    } satisfies Meta<typeof BlockTypePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

// Shown on typing `/` at the start of a block, inside NotionMarkdownBlockEditor.
export const Playground: Story =
    {
        args: {
            OnSelect: (Kind) => Alert.alert("Block kind selected", Kind)
        }
    };

// Demonstrates the i18n seam (see `NotionMarkdownBlockEditorProps.BlockTypeLabels`) --
// the package has no i18n dependency itself, a consuming app supplies this.
export const CustomLabels: Story =
    {
        args: {
            Labels: {
                Paragraph: "Texte",
                Heading1: "Titre 1",
                Quote: "Citation"
            },
            OnSelect: (Kind) => Alert.alert("Block kind selected", Kind)
        }
    };

export const Panel: Story =
    {
        args: {
            OnSelect: (Kind) => Alert.alert("Block kind selected", Kind),
            PanelMode: true
        }
    };
