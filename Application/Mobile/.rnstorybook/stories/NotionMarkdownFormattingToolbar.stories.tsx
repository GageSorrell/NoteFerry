/**
 * @module noteferry/Storybook/NotionMarkdownFormattingToolbar
 * @internal
 *
 * @file      NotionMarkdownFormattingToolbar.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { FormattingToolbar } from "@noteferry/react-native-notion-markdown";
import { LucideIconSet } from "@noteferry/react-native-notion-markdown/LucideIcons";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Alert } from "react-native";

const NoOp = (Label: string) => () => Alert.alert("Formatting action", Label);

const meta =
    {
        component: FormattingToolbar,
        title: "NotionMarkdown/FormattingToolbar"
    } satisfies Meta<typeof FormattingToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

// Purely presentational -- the actual text splicing happens in
// NotionMarkdownBlockEditor, which owns the focused TextInput's selection.
export const Playground: Story =
    {
        args: {
            CanIndent: true,
            CanOutdent: true,
            OnBold: NoOp("Bold"),
            OnColor: NoOp("Color"),
            OnIndent: NoOp("Indent"),
            OnItalic: NoOp("Italic"),
            OnLink: NoOp("Link"),
            OnOutdent: NoOp("Outdent"),
            OnStrikethrough: NoOp("Strikethrough"),
            OnUnderline: NoOp("Underline")
        }
    };

// The first block in a document -- neither indent nor outdent is valid yet.
export const AtDocumentStart: Story =
    {
        args: {
            CanIndent: false,
            CanOutdent: false,
            OnBold: NoOp("Bold"),
            OnColor: NoOp("Color"),
            OnIndent: NoOp("Indent"),
            OnItalic: NoOp("Italic"),
            OnLink: NoOp("Link"),
            OnOutdent: NoOp("Outdent"),
            OnStrikethrough: NoOp("Strikethrough"),
            OnUnderline: NoOp("Underline")
        }
    };

export const SelectionRow: Story =
    {
        args: {
            CanIndent: true,
            CanOutdent: true,
            HasSelection: true,
            OnBold: NoOp("Bold"),
            OnColor: NoOp("Color"),
            OnCode: NoOp("Inline code"),
            OnEquation: NoOp("Equation"),
            OnIndent: NoOp("Indent"),
            OnItalic: NoOp("Italic"),
            OnLink: NoOp("Link"),
            OnOutdent: NoOp("Outdent"),
            OnStrikethrough: NoOp("Strikethrough"),
            OnUnderline: NoOp("Underline")
        }
    };

export const LucideIcons: Story =
    {
        args: {
            CanIndent: true,
            CanOutdent: true,
            Icons: LucideIconSet,
            OnBold: NoOp("Bold"),
            OnColor: NoOp("Color"),
            OnIndent: NoOp("Indent"),
            OnItalic: NoOp("Italic"),
            OnLink: NoOp("Link"),
            OnOutdent: NoOp("Outdent"),
            OnStrikethrough: NoOp("Strikethrough"),
            OnUnderline: NoOp("Underline")
        }
    };
