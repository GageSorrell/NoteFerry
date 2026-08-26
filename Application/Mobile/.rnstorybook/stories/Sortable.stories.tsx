/**
 * Storybook stories for `@noteferry/ui`'s `Sortable` primitive — a fixed-
 * extent, vertical, drag-to-reorder list built on `react-native-gesture-
 * handler` + `react-native-reanimated`.
 *
 * @module noteferry/app/.rnstorybook/stories/Sortable
 *
 * @file      Sortable.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Sortable, Text } from "@noteferry/ui/Primitive";
import { View } from "react-native";

const InitialOrder = [ "Introduction", "Getting Started", "Advanced Usage", "FAQ" ];
const ItemExtent = 44;

const SortableExample = (): React.JSX.Element =>
{
    const [ Value, OnValueChange ] = React.useState<ReadonlyArray<string>>(InitialOrder);

    return (
        <View style={ { width: 280 } }>
            <Sortable.Root { ...{ ItemExtent, OnValueChange, Value } }>
                <Sortable.List>
                    { Value.map((Id: string) => (
                        <Sortable.Item
                            { ...{ Id } }
                            key={ Id }>
                            <View style={ {
                                alignItems: "center",
                                borderBottomColor: "rgba(0, 0, 0, 0.08)",
                                borderBottomWidth: 1,
                                flexDirection: "row",
                                height: ItemExtent,
                                paddingHorizontal: 8
                            } }>
                                <Sortable.Handle />
                                <Text Style={ { marginLeft: 8 } }
                                    Variant="Body">
                                    { Id }
                                </Text>
                            </View>
                        </Sortable.Item>
                    )) }
                </Sortable.List>
            </Sortable.Root>
        </View>
    );
};

const meta =
    {
        component: SortableExample,
        title: "Primitive/Sortable"
    } satisfies Meta<typeof SortableExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Sortable"
    };
