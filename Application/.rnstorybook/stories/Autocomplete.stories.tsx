/**
 * Storybook stories for `@notivex/ui`'s `Autocomplete` primitive — the
 * shared filtered-list engine behind `Combobox` and `Command`.
 *
 * @module notivex/app/.rnstorybook/stories/Autocomplete
 *
 * @file      Autocomplete.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Autocomplete,
    AutocompleteContent,
    AutocompleteEmpty,
    AutocompleteInput,
    AutocompleteItem,
    AutocompleteList
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const Fruits =
    [
        "Apple",
        "Apricot",
        "Banana",
        "Blueberry",
        "Cherry",
        "Grape",
        "Mango",
        "Orange",
        "Peach",
        "Pineapple"
    ];

const AutocompleteExample = (): React.JSX.Element => (
    <View style={ { width: 260 } }>
        <Autocomplete>
            <AutocompleteInput Placeholder="Search fruit..." />
            <AutocompleteContent Variant="Inline">
                <AutocompleteList>
                    { Fruits.map((Fruit: string) => (
                        <AutocompleteItem
                            Value={ Fruit }
                            key={ Fruit }
                        />
                    )) }
                    <AutocompleteEmpty />
                </AutocompleteList>
            </AutocompleteContent>
        </Autocomplete>
    </View>
);

const meta =
    {
        component: AutocompleteExample,
        title: "Primitive/Autocomplete"
    } satisfies Meta<typeof AutocompleteExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { };
