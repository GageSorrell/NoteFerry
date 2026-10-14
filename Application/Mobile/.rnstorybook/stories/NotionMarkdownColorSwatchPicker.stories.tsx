/**
 * @module noteferry/Storybook/NotionMarkdownColorSwatchPicker
 * @internal
 *
 * @file      NotionMarkdownColorSwatchPicker.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { ColorSwatchPicker } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Alert } from "react-native";

const meta =
    {
        component: ColorSwatchPicker,
        title: "NotionMarkdown/ColorSwatchPicker"
    } satisfies Meta<typeof ColorSwatchPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

// Shown from the FormattingToolbar's color button, inside NotionMarkdownBlockEditor.
export const Playground: Story =
    {
        args: {
            OnSelect: (Color) => Alert.alert("Color selected", Color)
        }
    };

export const WithSelection: Story =
    {
        args: {
            OnSelect: (Color) => Alert.alert("Color selected", Color),
            Value: "blue_bg"
        }
    };

export const Panel: Story =
    {
        args: {
            OnSelect: (Color) => Alert.alert("Color selected", Color),
            PanelMode: true
        }
    };

// Demonstrates the i18n seam (see `NotionMarkdownBlockEditorProps.ColorLabels` /
// `ColorTextSectionLabel` / `ColorBackgroundSectionLabel`) -- the package has no
// i18n dependency itself, a consuming app supplies this.
export const Localized: Story =
    {
        args: {
            BackgroundSectionLabel: "Arrière-plan",
            ColorLabels: {
                default: "Par défaut",
                red: "Rouge",
                blue: "Bleu"
            },
            OnSelect: (Color) => Alert.alert("Color selected", Color),
            TextSectionLabel: "Texte"
        }
    };
