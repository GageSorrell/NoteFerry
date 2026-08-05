/**
 * @module notivex/Storybook/Checkbox
 * @internal
 *
 * @file      Checkbox.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Checkbox, type CheckboxProps } from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import * as React from "react";
import { View } from "react-native";

const ControlledCheckbox = (Props: CheckboxProps): React.JSX.Element =>
{
    const [ Checked, OnCheckedChange ] = React.useState(Props.Checked ?? false);

    return (
        <Checkbox
            { ...{ ...Props, Checked, OnCheckedChange } }
        />
    );
};

const meta =
    {
        argTypes:
        {
            Disabled: { control: "boolean" },
            Size:
            {
                control: "select",
                options:
                [
                    "Medium",
                    "Small",
                    "ExtraSmall"
                ]
            }
        },
        component: ControlledCheckbox,
        title: "Primitive/Checkbox"
    } satisfies Meta<typeof ControlledCheckbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            AccessibilityLabel: "Checkbox",
            Size: "Medium"
        }
    };

export const AllStates: Story =
    {
        render: () =>
            <View style={ {
                alignItems: "center",
                flexDirection: "row",
                gap: 16
            } }>
                <ControlledCheckbox
                    AccessibilityLabel="Unchecked"
                    Checked={ false }
                />
                <ControlledCheckbox
                    AccessibilityLabel="Checked"
                    Checked
                />
                <Checkbox
                    AccessibilityLabel="Indeterminate"
                    Checked="Indeterminate"
                />
                <Checkbox
                    AccessibilityLabel="Disabled checked"
                    Checked
                    Disabled
                />
            </View>
    };
