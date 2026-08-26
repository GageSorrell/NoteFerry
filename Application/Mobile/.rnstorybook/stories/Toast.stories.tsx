/**
 * Storybook stories for `@noteferry/ui`'s `Toast` primitive. `<Toaster>` must
 * be mounted once; each story mounts its own instance rather than relying
 * on a real one at the app root, since these stories run standalone.
 *
 * @module noteferry/app/.rnstorybook/stories/Toast
 *
 * @file      Toast.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Button, Toast, Toaster } from "@noteferry/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

const ToastExample = (): React.JSX.Element =>
    <View
        style={ {
            height: 320,
            width: 260
        } }>
        <View
            style={ {
                alignItems: "stretch",
                gap: 8
            } }>
            <Button OnPress={ () => Toast("Saved changes") }>Default</Button>
            <Button
                Appearance="Blue"
                OnPress={ () => Toast.Success("Page published") }>
                Success
            </Button>
            <Button
                Appearance="Red"
                OnPress={ () => Toast.Error("Could not connect") }>
                Error
            </Button>
            <Button
                OnPress={ () =>
                    Toast.Promise(
                        new Promise((Resolve: (Value: unknown) => void) => setTimeout(Resolve, 1500)),
                        {
                            Error: "Upload failed",
                            Loading: "Uploading…",
                            Success: "Uploaded"
                        })
                }>
                Promise
            </Button>
        </View>
        <Toaster />
    </View>;

const meta =
    {
        component: ToastExample,
        title: "Primitive/Toast"
    } satisfies Meta<typeof ToastExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Toast"
    } as const;
