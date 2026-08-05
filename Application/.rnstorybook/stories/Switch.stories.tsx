/**
 * @module notivex/Storybook/Switch
 * @internal
 *
 * @file      Switch.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Switch, type SwitchProps } from "@notivex/ui/Primitive";
import { View } from "react-native";

const ControlledSwitch = (props: SwitchProps): React.JSX.Element =>
{
    const [ value, setValue ] = React.useState(props.Value ?? false);

    return <Switch { ...props }
        OnValueChange={ setValue }
        Value={ value } />;
};

const meta =
    {
        argTypes: {
            Disabled: { control: "boolean" },
            Size:
            {
                control: "select",
                options:
                [
                    "Medium",
                    "Small"
                ]
            }
        },
        component: ControlledSwitch,
        title: "Primitive/Switch"
    } satisfies Meta<typeof ControlledSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            AccessibilityLabel: "Switch",
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
                <ControlledSwitch
                    AccessibilityLabel="Off"
                    Value={ false }
                />
                <ControlledSwitch
                    AccessibilityLabel="On"
                    Value={ true }
                />
                <Switch
                    AccessibilityLabel="Disabled off"
                    Disabled
                    Value={ false }
                />
                <Switch
                    AccessibilityLabel="Disabled on"
                    Disabled
                    Value={ true }
                />
                <ControlledSwitch
                    AccessibilityLabel="Small"
                    Size="Small"
                />
            </View>
    };
