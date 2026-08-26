/**
 * Storybook stories for `@noteferry/ui`'s `DateSheet` primitive — the
 * Notion-style "edit Date property" bottom sheet. Built on `BottomSheet`
 * (`@expo/ui`-native), so — per `BottomSheet.stories.tsx`'s own caveat —
 * this renders but the sheet itself will not open under Expo Go or on web;
 * see the package ReadMe for building a dev client.
 *
 * @module noteferry/app/.rnstorybook/stories/DateSheet
 *
 * @file      DateSheet.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    type BottomSheet,
    Button,
    DateSheet,
    type DateSheetDateFormat,
    type DateSheetTimeFormat,
    Description
} from "@noteferry/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const DateSheetExample = (): React.JSX.Element =>
{
    const [ Value, OnValueChange ] = React.useState<Date | undefined>(new Date());
    const [ EndValue, OnEndValueChange ] = React.useState<Date | undefined>(undefined);
    const [ ShowEndDate, OnShowEndDateChange ] = React.useState(false);
    const [ IncludeTime, OnIncludeTimeChange ] = React.useState(false);
    const [ ActiveField, OnActiveFieldChange ] = React.useState<"Start" | "End">("Start");
    const [ DateFormat, OnDateFormatChange ] = React.useState<DateSheetDateFormat>("Full");
    const [ TimeFormat, OnTimeFormatChange ] = React.useState<DateSheetTimeFormat>("TwelveHour");
    const [ Timezone, OnTimezoneChange ] = React.useState<string | undefined>(undefined);

    const Ref = React.useRef<BottomSheet>(null);

    const OnClear = () =>
    {
        OnShowEndDateChange(false);
        OnIncludeTimeChange(false);
    };

    const OnPress = () =>
    {
        if (Ref.current !== null)
        {
            Ref.current.present();
            // Ref.current.expand();

            // Ref.current?.snapToPosition("80%");
            /* eslint-disable no-console */
            console.log("Snapped to 80%");
        }
        else
        {
            console.log("BottomSheetModal Ref was null.");
        }
    };

    const OnHelpPress = () => console.log("Help pressed");

    /* eslint-enable no-console */

    return (
        <View style={ { gap: 8, width: 300 } }>
            <Button { ...{ OnPress } }>
                Edit date
            </Button>
            <Description>
                { Value ? Value.toString() : "No date selected" }
                { ShowEndDate && EndValue ? ` → ${ EndValue.toString() }` : "" }
            </Description>
            <DateSheet
                { ...{
                    ActiveField,
                    DateFormat,
                    EndValue,
                    IncludeTime,
                    OnActiveFieldChange,
                    OnClear,
                    OnDateFormatChange,
                    OnEndValueChange,
                    OnHelpPress,
                    OnIncludeTimeChange,
                    OnShowEndDateChange,
                    OnTimeFormatChange,
                    OnTimezoneChange,
                    OnValueChange,
                    Ref,
                    ShowEndDate,
                    TimeFormat,
                    Timezone,
                    Value
                } }
            />
        </View>
    );
};

const meta =
    {
        component: DateSheetExample,
        title: "Primitive/DateSheet"
    } satisfies Meta<typeof DateSheetExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "DateSheet"
    } as const;
