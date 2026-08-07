/**
 * @module notivex/Storybook/Skeleton
 * @internal
 *
 * @file      Skeleton.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { Skeleton } from "@notivex/ui/Primitive";
import { View } from "react-native";

const meta =
    {
        component: Skeleton,
        title: "Primitive/Skeleton"
    } satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Skeleton",
        render: () =>
            <View style={ { gap: 8, width: 200 } }>
                <Skeleton
                    Style={ {
                        borderRadius: 20,
                        height: 40,
                        width: 40
                    } }
                />
                <Skeleton
                    Style={ {
                        height: 12,
                        width: "80%"
                    } }
                />
                <Skeleton
                    Style={ {
                        height: 12,
                        width: "60%"
                    } }
                />
            </View>
    };
