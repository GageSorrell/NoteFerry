/**
 * Storybook stories for `@noteferry/ui`'s `Selectable` primitive —
 * long-press-to-enter, tap-to-toggle multi-select over a list of items, the
 * mobile analogue of a desktop file manager's marquee select.
 *
 * @module noteferry/app/.rnstorybook/stories/Selectable
 *
 * @file      Selectable.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Body,
    Button,
    Description
} from "@noteferry/ui/Primitive";
import {
    IconBlock,
    SelectableCheckmark,
    SelectableItem,
    type SelectableItemState,
    SelectableRoot,
    useSelectable
} from "@noteferry/ui/Block";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const Pages = [ "Recipes", "Reading List", "Travel Journal", "Tasks" ] as const;

const SelectableToolbar = (): React.JSX.Element =>
{
    const { SelectedIds, IsActive, Deactivate } = useSelectable();

    if (!IsActive)
    {
        return <Description>Long-press a row to start selecting.</Description>;
    }

    return (
        <View style={ {
            alignItems: "center",
            flexDirection: "row",
            gap: 12,
            justifyContent: "space-between"
        } }>
            <Description>{ SelectedIds.size } selected</Description>
            <Button
                Appearance="Hint"
                OnPress={ Deactivate }
                Size="Small">
                Done
            </Button>
        </View>
    );
};

const SelectableExample = (): React.JSX.Element =>
    <View style={ { gap: 12, width: 280 } }>
        <SelectableRoot>
            <SelectableToolbar />
            <View style={ { gap: 4 } }>
                { Pages.map((Page: string) => (
                    <SelectableItem
                        Id={ Page }
                        key={ Page }>
                        { ({ IsSelected, IsActive }: SelectableItemState) => (
                            <View style={ {
                                alignItems: "center",
                                flexDirection: "row",
                                gap: 8,
                                height: 44,
                                paddingHorizontal: 4
                            } }>
                                { IsActive && <SelectableCheckmark { ...{ IsSelected } } /> }
                                <IconBlock
                                    Icon={ {
                                        Src: "file-text",
                                        Type: "Lucide"
                                    } }
                                    Size="Small"
                                />
                                <Body>
                                    { Page }
                                </Body>
                            </View>
                        ) }
                    </SelectableItem>
                )) }
            </View>
        </SelectableRoot>
    </View>;

const meta =
    {
        component: SelectableExample,
        title: "Block/Selectable"
    } satisfies Meta<typeof SelectableExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Selectable"
    } as const;
