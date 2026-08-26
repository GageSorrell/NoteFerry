/**
 * Storybook stories for `@noteferry/ui`'s `TreeSheet` primitive — a
 * searchable, expandable page/database picker bottom sheet. Built on
 * `BottomSheet` (`@expo/ui`-native), so — per `BottomSheet.stories.tsx`'s
 * own caveat — this renders but the sheet itself will not open under Expo
 * Go or on web; see the package ReadMe for building a dev client.
 *
 * @module noteferry/app/.rnstorybook/stories/TreeSheet
 *
 * @file      TreeSheet.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { type BottomSheet, Button, Description } from "@noteferry/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { type TreeItemData, TreeSheet } from "@noteferry/ui/Block";
import { View } from "react-native";

const SampleItems: ReadonlyArray<TreeItemData> =
    [
        { Icon: { Src: "user", Type: "Lucide" }, Id: "personal", Title: "Personal" },
        { Icon: { Src: "utensils", Type: "Lucide" }, Id: "recipes", ParentId: "personal", Title: "Recipes" },
        { Id: "pasta", ParentId: "recipes", Title: "Pasta Bake" },
        { Id: "tacos", ParentId: "recipes", Title: "Fish Tacos" },
        {
            Icon: { Src: "book-open", Type: "Lucide" },
            Id: "reading",
            ParentId: "personal",
            Title: "Reading List"
        },
        { Icon: { Src: "briefcase", Type: "Lucide" }, Id: "work", Title: "Work" },
        { Id: "tasks", ParentId: "work", Title: "Tasks" },
        { Id: "notes", ParentId: "work", Title: "Meeting Notes" }
    ];

const TreeSheetExample = (): React.JSX.Element =>
{
    const [ Value, OnValueChange ] = React.useState<string | undefined>(undefined);
    const Ref = React.useRef<BottomSheet>(null);

    const OnPress = () => Ref.current?.present();

    const HandleValueChange = (Id: string) =>
    {
        OnValueChange(Id);
        Ref.current?.dismiss();
    };

    const SelectedTitle = SampleItems.find((Item: TreeItemData) => Item.Id === Value)?.Title;

    return (
        <View style={ { gap: 8, width: 300 } }>
            <Button { ...{ OnPress } }>
                Choose a page
            </Button>
            <Description>
                { SelectedTitle ?? "No page selected" }
            </Description>
            <TreeSheet
                Items={ SampleItems }
                OnValueChange={ HandleValueChange }
                Ref={ Ref }
                Value={ Value }
            />
        </View>
    );
};

const meta =
    {
        component: TreeSheetExample,
        title: "Block/TreeSheet"
    } satisfies Meta<typeof TreeSheetExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "TreeSheet"
    } as const;
