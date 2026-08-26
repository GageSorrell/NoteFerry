/**
 * Storybook stories for `@noteferry/ui`'s `Calendar` primitive, a themed
 * wrapper around `react-native-calendars`.
 *
 * @module noteferry/app/.rnstorybook/stories/Calendar
 *
 * @file      Calendar.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Calendar, Text } from "@noteferry/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const CalendarExample = (): React.JSX.Element =>
{
    const [ Value, SetValue ] = React.useState<Date | undefined>(new Date());

    return (
        <View style={ {
            gap: 8,
            width: 300
        } }>
            <Calendar
                OnValueChange={ SetValue }
                Value={ Value }
            />
            <Text Variant="Description">{ Value ? Value.toDateString() : "No date selected" }</Text>
        </View>
    );
};

const meta =
    {
        component: CalendarExample,
        title: "Primitive/Calendar"
    } satisfies Meta<typeof CalendarExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Calendar"
    } as const;
