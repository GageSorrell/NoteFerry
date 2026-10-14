/**
 * @module noteferry/Storybook/NotionMarkdownCalloutView
 * @internal
 *
 * @file      NotionMarkdownCalloutView.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { CalloutView } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Text } from "react-native";

const meta =
    {
        argTypes: {
            Color: {
                control: "select",
                options: [ undefined, "default", "blue_bg", "yellow_bg", "red_bg", "green_bg" ]
            },
            Icon: { control: "text" }
        },
        component: CalloutView,
        title: "NotionMarkdown/CalloutView"
    } satisfies Meta<typeof CalloutView>;

export default meta;

type Story = StoryObj<typeof meta>;

// A callout has no own text prop -- its body is nested child blocks, passed
// as `children` (typically a leading Paragraph), matching `Ast.ts`'s model.
export const Playground: Story =
    {
        args: {
            Color: "blue_bg",
            Icon: "💡",
            children: <Text>Callouts hold nested blocks, not inline text.</Text>
        }
    };

export const NoIcon: Story =
    {
        args: {
            Icon: null,
            children: <Text>A callout with no icon attribute.</Text>
        }
    };

export const WithNestedList: Story =
    {
        args: {
            Color: "yellow_bg",
            Icon: "⚠️",
            children:
                <>
                    <Text>Heads up — this has more than one child block.</Text>
                    <Text>• Including a bulleted item.</Text>
                </>
        }
    };
