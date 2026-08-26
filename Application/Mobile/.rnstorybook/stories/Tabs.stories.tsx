/**
 * Storybook stories for `@noteferry/ui`'s `Tabs` primitive.
 *
 * @module noteferry/app/.rnstorybook/stories/Tabs
 *
 * @file      Tabs.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Text
} from "@noteferry/ui/Primitive";
import { View } from "react-native";

const TabsExample = (): React.JSX.Element => (
    <View style={ { width: 280 } }>
        <Tabs DefaultValue="board">
            <TabsList>
                <TabsTrigger Value="board">Board</TabsTrigger>
                <TabsTrigger Value="table">Table</TabsTrigger>
                <TabsTrigger Value="calendar">Calendar</TabsTrigger>
            </TabsList>
            <TabsContent Value="board">
                <Text Style={ { paddingTop: 12 } }
                    Variant="Body">Board view content.</Text>
            </TabsContent>
            <TabsContent Value="table">
                <Text Style={ { paddingTop: 12 } }
                    Variant="Body">Table view content.</Text>
            </TabsContent>
            <TabsContent Value="calendar">
                <Text Style={ { paddingTop: 12 } }
                    Variant="Body">Calendar view content.</Text>
            </TabsContent>
        </Tabs>
    </View>
);

const meta =
    {
        component: TabsExample,
        title: "Primitive/Tabs"
    } satisfies Meta<typeof TabsExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Tabs"
    } as const;
