/**
 * Storybook stories for `@notivex/ui`'s `Tooltip` primitive.
 *
 * @module notivex/app/.rnstorybook/stories/Tooltip
 *
 * @file      Tooltip.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Text, Tooltip, TooltipContent, TooltipPreset, TooltipTrigger } from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import * as React from "react";
import { View } from "react-native";

// `TooltipTrigger` owns the only `Pressable` here deliberately — it needs
// `onHoverIn`/`onLongPress`, which a nested `Button` (itself a `Pressable`)
// would swallow before either ever reached the trigger. Use inert content
// (a styled `View`/`Text`, not `Button`) as `TooltipTrigger`'s children.
const IconBadge = (): React.JSX.Element => (
    <View style={{ alignItems: "center", borderRadius: 14, borderWidth: 1, height: 28, justifyContent: "center", width: 28 }}>
        <Text Variant="Label">i</Text>
    </View>
);

const TooltipExample = (): React.JSX.Element => (
    <Tooltip>
        <TooltipTrigger>
            <IconBadge />
        </TooltipTrigger>
        <TooltipContent>
            Long-press to reveal this hint.
        </TooltipContent>
    </Tooltip>
);

const meta =
    {
        component: TooltipExample,
        title: "Primitive/Tooltip"
    } satisfies Meta<typeof TooltipExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Preset: Story =
    {
        render: () => (
            <TooltipPreset Description="A shorthand for the Tooltip/TooltipTrigger/TooltipContent trio.">
                <IconBadge />
            </TooltipPreset>
        )
    };
