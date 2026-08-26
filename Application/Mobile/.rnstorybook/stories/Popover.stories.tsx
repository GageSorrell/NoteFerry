/**
 * @module noteferry/app/.rnstorybook/stories/Popover
 *
 * @file      Popover.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger, Text } from "@noteferry/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const PopoverExample = (): React.JSX.Element => (
    <Popover>
        <PopoverTrigger AsChild>
            <Button>
                Open popover
            </Button>
        </PopoverTrigger>
        <PopoverContent>
            <View
                style={ {
                    alignItems: "flex-start",
                    gap: 8
                } }>
                <Text Variant="Heading3">
                    Popover title
                </Text>
                <Text Variant="Description">
                    Anchored to the trigger, dismissed by tapping outside.
                </Text>
                <PopoverClose />
            </View>
        </PopoverContent>
    </Popover>
);

const meta =
    {
        component: PopoverExample,
        title: "Primitive/Popover"
    } satisfies Meta<typeof PopoverExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Popover"
    } as const;
