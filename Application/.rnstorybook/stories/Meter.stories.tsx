/**
 * @module notivex/Storybook/Meter
 * @internal
 *
 * @file      Meter.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { MeterBar, MeterRing } from "@notivex/ui/Primitive";
import { View } from "react-native";

const meta =
    {
        argTypes:
        {
            Max: { control: "number" },
            Value:
            {
                control: "range",
                max: 100,
                min: 0,
                step: 1
            }
        },
        component: MeterBar,
        title: "Primitive/Meter"
    } satisfies Meta<typeof MeterBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Bar: Story =
    {
        args:
        {
            Max: 100,
            Value: 60
        },
        render: (args: any) => (
            <View style={ { width: 220 } }>
                <MeterBar { ...args } />
            </View>
        )
    };

export const Ring: Story =
    {
        args:
        {
            Max: 100,
            Value: 60
        },
        render: (args: any) =>
            <MeterRing
                { ...args }
                Size={ 40 }
            />
    };

export const AllProgress: Story =
    {
        args: { Value: 60 },
        render: () => (
            <View style={ {
                alignItems: "center",
                flexDirection: "row",
                gap: 24
            } }>
                <MeterRing
                    Size={ 32 }
                    Value={ 0 }
                />
                <MeterRing
                    Size={ 32 }
                    Value={ 25 }
                />
                <MeterRing
                    Size={ 32 }
                    Value={ 60 }
                />
                <MeterRing
                    Size={ 32 }
                    Value={ 100 }
                />
            </View>
        )
    };
