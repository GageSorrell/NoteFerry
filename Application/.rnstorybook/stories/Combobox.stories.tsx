/**
 * Storybook stories for `@notivex/ui`'s `Combobox` primitive — a searchable
 * single-select built on the `Autocomplete` engine.
 *
 * @module notivex/app/.rnstorybook/stories/Combobox
 *
 * @file      Combobox.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    ComboboxValue
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const Timezone =
    Object.freeze([
        "UTC",
        "America/New_York",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Berlin",
        "Asia/Tokyo",
        "Asia/Singapore"
    ] as const);

type Timezone = typeof Timezone[number];

const ComboboxExample = (): React.JSX.Element =>
{
    const [ Value, SetValue ] = React.useState("UTC");

    return (
        <View style={ { width: 220 } }>
            <Combobox OnValueChange={ SetValue }
                Value={ Value }>
                <ComboboxTrigger>
                    <ComboboxValue Placeholder="Choose a timezone" />
                </ComboboxTrigger>
                <ComboboxContent>
                    <ComboboxInput Placeholder="Search timezone..." />
                    <ComboboxList>
                        { Timezone.map((Timezone: Timezone) => (
                            <ComboboxItem
                                Value={ Timezone }
                                key={ Timezone }
                            />
                        )) }
                        <ComboboxEmpty />
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </View>
    );
};

const meta =
    {
        component: ComboboxExample,
        title: "Primitive/Combobox"
    } satisfies Meta<typeof ComboboxExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { };
