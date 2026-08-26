/**
 * Storybook stories for `@noteferry/ui`'s `Select` primitive.
 *
 * @module noteferry/app/.rnstorybook/stories/Select
 *
 * @file      Select.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@noteferry/ui/Primitive";
import { View } from "react-native";

const SelectExample = (): React.JSX.Element =>
{
    const [ value, setValue ] = React.useState("board");

    return (
        <View style={ { width: 220 } }>
            <Select OnValueChange={ setValue }
                Value={ value }>
                <SelectTrigger>
                    <SelectValue Placeholder="Choose a view" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        Label="Board"
                        Value="board"
                    />
                    <SelectItem
                        Label="Table"
                        Value="table"
                    />
                    <SelectItem
                        Label="Calendar"
                        Value="calendar"
                    />
                    <SelectItem
                        Label="List"
                        Value="list"
                    />
                </SelectContent>
            </Select>
        </View>
    );
};

const meta =
    {
        component: SelectExample,
        title: "Primitive/Select"
    } satisfies Meta<typeof SelectExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { name: "Select" } as const;
