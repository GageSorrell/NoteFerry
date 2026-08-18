/**
 * @module notivex/Storybook/Label
 * @internal
 *
 * @file      Label.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { Label } from "@notivex/ui/Primitive";
import { View } from "react-native";

const meta =
    {
        argTypes:
        {
            Disabled: { control: "boolean" }
        },
        component: Label,
        title: "Primitive/Label"
    } satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args: { children: "Field label" }
    };

export const AllStates: Story =
    {
        render: () => (
            <View style={ { gap: 8 } }>
                <Label>Enabled</Label>
                <Label Disabled>Disabled</Label>
            </View>
        )
    };
