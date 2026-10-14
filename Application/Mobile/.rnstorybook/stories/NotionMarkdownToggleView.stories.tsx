/**
 * @module noteferry/Storybook/NotionMarkdownToggleView
 * @internal
 *
 * @file      NotionMarkdownToggleView.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { ToggleView } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Text } from "react-native";

const meta =
    {
        component: ToggleView,
        title: "NotionMarkdown/ToggleView"
    } satisfies Meta<typeof ToggleView>;

export default meta;

type Story = StoryObj<typeof meta>;

// Collapsed by default, matching Notion's own toggle behavior -- tap the
// chevron in the on-device Storybook UI to expand it.
export const CollapsedByDefault: Story =
    {
        args: {
            Title: "Click to expand",
            children: <Text>This content is collapsed by default.</Text>
        }
    };

export const ExpandedByDefault: Story =
    {
        args: {
            DefaultCollapsed: false,
            Title: "Starts expanded",
            children: <Text>This content starts visible.</Text>
        }
    };
