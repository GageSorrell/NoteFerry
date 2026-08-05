/**
 * Storybook stories for `@notivex/ui`'s `ContextMenu` primitive —
 * `DropdownMenu`'s engine, opened by long-press instead of tap.
 *
 * @module notivex/app/.rnstorybook/stories/ContextMenu
 *
 * @file      ContextMenu.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    Text
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import * as React from "react";
import { View } from "react-native";

const ContextMenuExample = (): React.JSX.Element => (
    <ContextMenu>
        <ContextMenuTrigger>
            <View
                style={ {
                    alignItems: "center",
                    borderRadius: 8,
                    borderWidth: 1,
                    height: 120,
                    justifyContent: "center",
                    width: 220
                } }>
                <Text Variant="Description">
                    Long-press this card
                </Text>
            </View>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem
                Label="Copy"
                OnSelect={ () => { } }
            />
            <ContextMenuItem
                Label="Move to…"
                OnSelect={ () => { } }
            />
            <ContextMenuItem
                Label="Delete"
                OnSelect={ () => { } }
                Variant="Error"
            />
        </ContextMenuContent>
    </ContextMenu>
);

const meta =
    {
        component: ContextMenuExample,
        title: "Primitive/ContextMenu"
    } satisfies Meta<typeof ContextMenuExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { };
