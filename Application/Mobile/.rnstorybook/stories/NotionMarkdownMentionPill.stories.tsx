/**
 * @module noteferry/Storybook/NotionMarkdownMentionPill
 * @internal
 *
 * @file      NotionMarkdownMentionPill.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { MentionPill } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Alert, Text, View } from "react-native";

const meta =
    {
        component: MentionPill,
        title: "NotionMarkdown/MentionPill"
    } satisfies Meta<typeof MentionPill>;

export default meta;

type Story = StoryObj<typeof meta>;

export const User: Story =
    {
        args: {
            Mention: { MentionKind: "user", Url: "u1", DisplayText: "Ada Lovelace" },
            OnPress: (Mention) => Alert.alert("Mention pressed", JSON.stringify(Mention))
        }
    };

export const Page: Story =
    {
        args: {
            Mention: { MentionKind: "page", Url: "p1", DisplayText: "Roadmap" }
        }
    };

export const DatabaseKind: Story =
    {
        args: {
            Mention: { MentionKind: "database", Url: "d1", DisplayText: "Tasks" }
        }
    };

export const DateRange: Story =
    {
        args: {
            Mention: { MentionKind: "date", Start: "2026-01-01", End: "2026-01-05" }
        }
    };

export const InlineWithinText: Story =
    {
        render: () =>
            <View style={ { width: 260 } }>
                <Text>
                    Assigned to <MentionPill Mention={ { MentionKind: "user", Url: "u1", DisplayText: "Ada Lovelace" } } />, due <MentionPill Mention={ { MentionKind: "date", Start: "2026-01-01", End: null } } />.
                </Text>
            </View>
    };
