/**
 * @module notivex/Storybook/Spinner
 * @internal
 *
 * @file      Spinner.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { Spinner } from "@notivex/ui/Primitive";
import { View } from "react-native";

const meta =
    {
        argTypes:
        {
            Size: { control: "number" },
            Variant:
            {
                control: "select",
                options:
                [
                    "Solid",
                    "Dashed"
                ]
            }
        },
        component: Spinner,
        title: "Primitive/Spinner"
    } satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            Size: 24,
            Variant: "Solid"
        }
    };

export const AllVariants: Story =
    {
        render: () =>
            <View style={ {
                alignItems: "center",
                flexDirection: "row",
                gap: 24
            } }>
                <Spinner
                    Size={ 24 }
                    Variant="Solid"
                />
                <Spinner
                    Size={ 24 }
                    Variant="Dashed"
                />
            </View>
    };
