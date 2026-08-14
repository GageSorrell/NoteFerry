/**
 * @module notivex/Storybook/Avatar
 * @internal
 *
 * @file      Avatar.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage, type AvatarProps, Text } from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const AvatarWithFallback = (props: AvatarProps): React.JSX.Element => (
    <Avatar { ...props }>
        <AvatarImage Source="https://picsum.photos/seed/notivex/128" />
        <AvatarFallback>
            <Text Variant="Label">NX</Text>
        </AvatarFallback>
    </Avatar>
);

const meta =
    {
        argTypes:
        {
            Size: { control: "number" }
        },
        component: AvatarWithFallback,
        title: "Primitive/Avatar"
    } satisfies Meta<typeof AvatarWithFallback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            Size: 40
        }
    } as const;

export const BrokenImageFallback: Story =
    {
        render: () => (
            <Avatar Size={ 40 }>
                <AvatarImage Source="https://example.invalid/does-not-exist.png" />
                <AvatarFallback>
                    <Text Variant="Label">NX</Text>
                </AvatarFallback>
            </Avatar>
        )
    };

export const Sizes: Story =
    {
        render: () => (
            <View style={ {
                alignItems: "center",
                flexDirection: "row",
                gap: 12
            } }>
                <AvatarWithFallback Size={ 24 } />
                <AvatarWithFallback Size={ 32 } />
                <AvatarWithFallback Size={ 40 } />
                <AvatarWithFallback Size={ 56 } />
            </View>
        )
    };
