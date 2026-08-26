/**
 * @module noteferry/Storybook/Text
 * @internal
 *
 * @file      Text.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { Text } from "@noteferry/ui/Primitive";
import { View } from "react-native";

const meta =
    {
        argTypes:
        {
            NumberOfLines: { control: "number" },
            Variant:
            {
                control: "select",
                options:
                [
                    "Heading1",
                    "Heading2",
                    "Heading3",
                    "Body",
                    "Label",
                    "Description"
                ]
            }
        },
        component: Text,
        title: "Primitive/Text"
    } satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every `Variant` rendered together, for side-by-side comparison. */
export const AllVariants: Story =
    {
        args: { Variant: "Body" },
        name: "Text",
        render: () => (
            <View style={ { alignItems: "flex-start", gap: 12 } }>
                <Text Variant="Heading1">Heading1</Text>
                <Text Variant="Heading2">Heading2</Text>
                <Text Variant="Heading3">Heading3</Text>
                <Text Variant="Body">The quick brown fox.</Text>
                <Text Variant="Label">Label Text</Text>
                <Text Variant="Description">Description (muted, small print).</Text>
            </View>
        )
    } as const;
