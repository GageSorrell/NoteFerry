/**
 * @module noteferry/Storybook/NotionMarkdownDividerView
 * @internal
 *
 * @file      NotionMarkdownDividerView.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { DividerView } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Text, View } from "react-native";

const meta =
    {
        component: DividerView,
        title: "NotionMarkdown/DividerView"
    } satisfies Meta<typeof DividerView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: {} };

export const InContext: Story =
    {
        render: () =>
            <View style={ { width: 240 } }>
                <Text>A paragraph above the divider.</Text>
                <DividerView />
                <Text>A paragraph below the divider.</Text>
            </View>
    };
