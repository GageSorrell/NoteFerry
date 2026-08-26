/**
 * Storybook stories for `@noteferry/ui`'s `TagsInput` primitive.
 *
 * @module noteferry/app/.rnstorybook/stories/TagsInput
 *
 * @file      TagsInput.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { TagsInput } from "@noteferry/ui/Primitive";
import { View } from "react-native";

const TagsInputExample = (): React.JSX.Element =>
{
    const [ Value, SetValue ] = React.useState<ReadonlyArray<string>>([ "Design", "Engineering" ]);

    return (
        <View style={ { width: 280 } }>
            <TagsInput
                OnValueChange={ SetValue }
                Placeholder="Add a tag…"
                Value={ Value }
            />
        </View>
    );
};

const meta =
    {
        component: TagsInputExample,
        title: "Primitive/TagsInput"
    } satisfies Meta<typeof TagsInputExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "TagsInput"
    } as const;
