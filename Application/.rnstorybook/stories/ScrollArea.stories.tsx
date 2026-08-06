/**
 * Storybook stories for `@notivex/ui`'s `ScrollArea` primitive.
 *
 * @module notivex/app/.rnstorybook/stories/ScrollArea
 *
 * @file      ScrollArea.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { ScrollArea, Text } from "@notivex/ui/Primitive";
import { Array } from "effect";
import { View } from "react-native";

const Rows = Array.range(0, 19).map((Index: number) => `Row ${ Index + 1 }`);

const ScrollAreaExample = (): React.JSX.Element => (
    <View style={ {
        borderColor: "rgba(0, 0, 0, 0.08)",
        borderWidth: 1,
        height: 180,
        width: 260
    } }>
        <ScrollArea>
            { Rows.map((Row: string) => (
                <View
                    key={ Row }
                    style={ {
                        borderBottomColor: "rgba(0, 0, 0, 0.05)",
                        borderBottomWidth: 1,
                        padding: 10
                    } }>
                    <Text Variant="Body">
                        { Row }
                    </Text>
                </View>
            )) }
        </ScrollArea>
    </View>
);

const meta =
    {
        component: ScrollAreaExample,
        title: "Primitive/ScrollArea"
    } satisfies Meta<typeof ScrollAreaExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { };
