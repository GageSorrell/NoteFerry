/**
 * Storybook stories for `@notivex/ui`'s `BottomSheet` primitive. Built on
 * `@expo/ui`, which needs a custom dev client — this story renders but the
 * sheet itself will not open under Expo Go or on web; see the package
 * ReadMe for building a dev client.
 *
 * @module notivex/app/.rnstorybook/stories/BottomSheet
 *
 * @file      BottomSheet.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    BottomSheet,
    BottomSheetDescription,
    BottomSheetFooter,
    BottomSheetHeader,
    BottomSheetTitle,
    Button
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";

const BottomSheetExample = (): React.JSX.Element =>
{
    const [ IsPresented, SetIsPresented ] = React.useState(false);

    const OnDismiss = () => SetIsPresented(false);

    const Ref = React.useRef(null);

    return (
        <>
            <Button OnPress={ () => SetIsPresented(true) }>
                Open bottom sheet
            </Button>
            <BottomSheet { ...{ IsPresented, OnDismiss, Ref } }>
                <BottomSheetHeader>
                    <BottomSheetTitle>
                        Share this page
                    </BottomSheetTitle>
                    <BottomSheetDescription>
                        Anyone with the link can view.
                    </BottomSheetDescription>
                </BottomSheetHeader>
                <BottomSheetFooter>
                    <Button
                        Appearance="Blue"
                        OnPress={ () => SetIsPresented(false) }>
                        Copy link
                    </Button>
                </BottomSheetFooter>
            </BottomSheet>
        </>
    );
};

const meta =
    {
        component: BottomSheetExample,
        title: "Primitive/BottomSheet"
    } satisfies Meta<typeof BottomSheetExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "BottomSheet"
    } as const;
