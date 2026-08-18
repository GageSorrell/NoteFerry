/**
 * @module notivex/Storybook/Input
 * @internal
 *
 * @file      Input.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Input, type InputProps } from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const ControlledInput = (props: InputProps): React.JSX.Element =>
{
    const [ value, setValue ] = React.useState(props.Value ?? "");

    return <Input { ...props }
        OnCancel={ () => setValue("") }
        OnChangeText={ setValue }
        Value={ value } />;
};

const meta = {
    argTypes: {
        Clear: { control: "boolean" },
        Disabled: { control: "boolean" },
        Invalid: { control: "boolean" },
        Search: { control: "boolean" },
        Size:
        {
            control: "select",
            options:
            [
                "Default",
                "Large"
            ]
        },
        Variant:
        {
            control: "select",
            options:
            [
                "Default",
                "Plain",
                "Flat"
            ]
        }
    },
    component: ControlledInput,
    title: "Primitive/Input"
} satisfies Meta<typeof ControlledInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            Clear: true,
            Placeholder: "Type something…",
            Search: false,
            Size: "Default",
            Variant: "Default"
        }
    };

export const Search: Story =
    {
        args:
        {
            Clear: true,
            Placeholder: "Search…",
            Search: true
        }
    };

export const Invalid: Story =
    {
        args:
        {
            Invalid: true,
            Value: "not-an-email"
        }
    };

export const AllStates: Story =
    {
        render: () => (
            <View style={ { gap: 12, width: 260 } }>
                <ControlledInput Placeholder="Default" />
                <ControlledInput
                    Clear
                    Placeholder="Search"
                    Search
                />
                <ControlledInput
                    Placeholder="Large"
                    Size="Large"
                />
                <ControlledInput
                    Placeholder="Flat"
                    Variant="Flat"
                />
                <ControlledInput
                    Invalid
                    Value="Invalid value"
                />
                <ControlledInput
                    Disabled
                    Value="Disabled"
                />
            </View>
        )
    };
