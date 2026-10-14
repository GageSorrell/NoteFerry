/**
 * @module noteferry/Storybook/NotionMarkdownEquationView
 * @internal
 *
 * @file      NotionMarkdownEquationView.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { EquationView } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Text, View } from "react-native";

const meta =
    {
        argTypes: { Inline: { control: "boolean" } },
        component: EquationView,
        title: "NotionMarkdown/EquationView"
    } satisfies Meta<typeof EquationView>;

export default meta;

type Story = StoryObj<typeof meta>;

// v1 renders LaTeX source verbatim, not real math typesetting — see
// Milestone 6 in the project plan for real KaTeX rendering.
export const Block: Story =
    {
        args: { Expression: "\\int_0^1 x^2 dx = \\frac{1}{3}" }
    };

export const Inline: Story =
    {
        args: { Expression: "E = mc^2", Inline: true }
    };

export const InlineWithinText: Story =
    {
        render: () =>
            <View style={ { width: 260 } }>
                <Text>
                    The equation <EquationView Expression="E = mc^2" Inline /> relates energy and mass.
                </Text>
            </View>
    };
