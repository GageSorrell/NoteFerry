/**
 * @module notivex/Storybook/RadioGroup
 * @internal
 *
 * @file      RadioGroup.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Label, RadioGroup, RadioGroupItem, type RadioGroupProps } from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import * as React from "react";
import { View } from "react-native";

const ControlledRadioGroup = (Props: RadioGroupProps): React.JSX.Element =>
{
    const [ Value, OnValueChange ] = React.useState(Props.Value ?? "A");

    return (
        <RadioGroup
            { ...{ ...Props, OnValueChange, Value } }>
            <View style={ {
                alignItems: "center",
                flexDirection: "row",
                gap: 8
            } }>
                <RadioGroupItem Value="A" />
                <Label>Option A</Label>
            </View>
            <View
                style={ {
                    alignItems: "center",
                    flexDirection: "row",
                    gap: 8
                } }>
                <RadioGroupItem Value="B" />
                <Label>Option B</Label>
            </View>
            <View
                style={ {
                    alignItems: "center",
                    flexDirection: "row",
                    gap: 8
                } }>
                <RadioGroupItem Value="C" />
                <Label>Option C</Label>
            </View>
        </RadioGroup>
    );
};

const meta =
    {
        argTypes:
        {
            Disabled: { control: "boolean" }
        },
        component: ControlledRadioGroup,
        title: "Primitive/RadioGroup"
    } satisfies Meta<typeof ControlledRadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args: { Value: "A" }
    };

export const Disabled: Story =
    {
        args:
        {
            Disabled: true,
            Value: "B"
        }
    };
