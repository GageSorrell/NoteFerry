/**
 * Storybook stories for `@noteferry/ui`'s `Cover` primitive — a page's cover
 * image, with a tap-visible "Change cover"/"Remove" action pair.
 *
 * @module noteferry/app/.rnstorybook/stories/Cover
 *
 * @file      Cover.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Cover, CoverSkeleton } from "@noteferry/ui/Block";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Description } from "@noteferry/ui/Primitive";
import { View } from "react-native";

const CoverExample = (): React.JSX.Element =>
{
    const [ Url, SetUrl ] = React.useState<string | undefined>(
        "https://picsum.photos/seed/noteferry-cover/900/400"
    );

    return (
        <View style={ { gap: 8, width: 320 } }>
            <Cover
                OnChangeCoverPress={ () =>
                    SetUrl(`https://picsum.photos/seed/noteferry-${ Date.now() }/900/400`)
                }
                OnRemovePress={ () => SetUrl(undefined) }
                { ...{ Url } }
            />
            <Description>
                { Url === undefined
                    ? "No cover"
                    : "Tap the overlay buttons to change or remove the cover." }
            </Description>
        </View>
    );
};

const meta =
    {
        component: CoverExample,
        title: "Block/Cover"
    } satisfies Meta<typeof CoverExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Cover"
    } as const;

export const Loading: Story =
    {
        render: () => (
            <View style={ { width: 320 } }>
                <CoverSkeleton />
            </View>
        )
    };

export const Empty: Story =
    {
        render: () => (
            <View style={ { width: 320 } }>
                <Cover />
            </View>
        )
    };
