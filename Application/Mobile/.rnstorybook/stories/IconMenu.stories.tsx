/**
 * Storybook stories for `@noteferry/ui`'s `IconMenu` primitive — a page icon
 * picker bottom sheet (emoji, Lucide icon, or an uploaded photo). Built on
 * `BottomSheet` (`@expo/ui`-native), so — per `BottomSheet.stories.tsx`'s
 * own caveat — this renders but the sheet itself will not open under Expo
 * Go or on web; see the package ReadMe for building a dev client.
 *
 * @module noteferry/app/.rnstorybook/stories/IconMenu
 *
 * @file      IconMenu.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { type BottomSheet, Button } from "@noteferry/ui/Primitive";
import { IconBlock, type IconData, IconMenu } from "@noteferry/ui/Block";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const IconMenuExample = (): React.JSX.Element =>
{
    const [ Icon, SetIcon ] = React.useState<IconData | undefined>({ Src: "📚", Type: "Emoji" });
    const Ref = React.useRef<BottomSheet>(null);

    const OnPress = () => Ref.current?.present();

    const OnSelect = (NextIcon: IconData) =>
    {
        SetIcon(NextIcon);
        Ref.current?.dismiss();
    };

    const OnRemove = () =>
    {
        SetIcon(undefined);
        Ref.current?.dismiss();
    };

    return (
        <View style={ { alignItems: "flex-start", gap: 12 } }>
            <Button
                Appearance="Icon"
                { ...{ OnPress } }>
                <IconBlock
                    Icon={ Icon ?? { Src: "Untitled", Type: "Text" } }
                    Size="Medium"
                />
            </Button>
            <Button { ...{ OnPress } }>
                Change icon
            </Button>
            <IconMenu
                OnRemove={ Icon === undefined ? undefined : OnRemove }
                OnSelect={ OnSelect }
                Ref={ Ref }
            />
        </View>
    );
};

const meta =
    {
        component: IconMenuExample,
        title: "Block/IconMenu"
    } satisfies Meta<typeof IconMenuExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "IconMenu"
    } as const;
