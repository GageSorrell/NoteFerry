/**
 * @module notivex/Storybook/Badge
 * @internal
 *
 * @file      Badge.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { Badge } from "@notivex/ui/Primitive";
import { View } from "react-native";

const meta =
    {
        argTypes:
        {
            Size: { control: "select", options: [ "Medium", "Small" ] },
            Variant: { control: "select", options: [ "Default", "Gray", "Blue", "Orange", "Tag" ] }
        },
        component: Badge,
        title: "Primitive/Badge"
    } satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            Size: "Medium",
            Variant: "Default",
            children: "Badge"
        }
    };

export const AllVariants: Story =
    {
        render: () => (
            <View style={ {
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center"
            } }>
                <Badge Variant="Default">Default</Badge>
                <Badge Variant="Gray">Gray</Badge>
                <Badge Variant="Blue">Blue</Badge>
                <Badge Variant="Orange">Orange</Badge>
                <Badge Variant="Tag">Tag</Badge>
            </View>
        )
    };
