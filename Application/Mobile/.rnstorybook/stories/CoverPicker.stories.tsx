/**
 * Storybook stories for `@notivex/ui`'s `CoverPicker` primitive — a page
 * cover-image picker bottom sheet (upload a photo, or paste an image URL).
 * Built on `BottomSheet` (`@expo/ui`-native), so — per
 * `BottomSheet.stories.tsx`'s own caveat — this renders but the sheet
 * itself will not open under Expo Go or on web; see the package ReadMe for
 * building a dev client.
 *
 * @module notivex/app/.rnstorybook/stories/CoverPicker
 *
 * @file      CoverPicker.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Cover, CoverPicker } from "@notivex/ui/Block";
import type { Meta, StoryObj } from "@storybook/react-native";
import { type BottomSheet } from "@notivex/ui/Primitive";
import { View } from "react-native";

const CoverPickerExample = (): React.JSX.Element =>
{
    const [ Url, SetUrl ] = React.useState<string | undefined>(
        "https://images.unsplash.com/photo-1784239608832-a23eff7a2b4c"
    );

    const Ref = React.useRef<BottomSheet>(null);

    const OnChangeCoverPress = () => Ref.current?.present();

    const OnSelect = (NextUrl: string) =>
    {
        SetUrl(NextUrl);
        Ref.current?.dismiss();
    };

    const OnRemove = () =>
    {
        if (Url === undefined)
        {
            return;
        }

        SetUrl(undefined);
        Ref.current?.dismiss();
    };

    const OnRemovePress = OnRemove;

    return (
        <View style={ { width: 320 } }>
            <Cover { ...{ OnChangeCoverPress, OnRemovePress,  Url } } />
            <CoverPicker { ...{ OnRemove, OnSelect, Ref } } />
        </View>
    );
};

const meta =
    {
        component: CoverPickerExample,
        title: "Block/CoverPicker"
    } satisfies Meta<typeof CoverPickerExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "CoverPicker"
    } as const;
