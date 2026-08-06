/**
 * @module notivex/Storybook/Separator
 * @internal
 *
 * @file      Separator.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { Separator, Text } from "@notivex/ui/Primitive";
import { View } from "react-native";

const meta =
    {
        argTypes:
        {
            Orientation:
            {
                control: "select",
                options:
                [
                    "Horizontal",
                    "Vertical"
                ]
            }
        },
        component: Separator,
        title: "Primitive/Separator"
    } satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args: { Orientation: "Horizontal" },
        render: (args: any) =>
            <View style={ { width: 220 } }>
                <Text Variant="Body">Above</Text>
                <View style={ { marginVertical: 8 } }>
                    <Separator { ...args } />
                </View>
                <Text Variant="Body">Below</Text>
            </View>
    };

export const Vertical: Story =
    {
        render: () =>
            <View style={ {
                alignItems: "center",
                flexDirection: "row",
                gap: 8,
                height: 24
            } }>
                <Text Variant="Body">Left</Text>
                <Separator Orientation="Vertical" />
                <Text Variant="Body">Right</Text>
            </View>
    };
