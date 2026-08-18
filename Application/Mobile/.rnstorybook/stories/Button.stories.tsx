/**
 * @module notivex/Storybook/Button
 * @internal
 *
 * @file      Button.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { Button } from "@notivex/ui/Primitive";
import { View } from "react-native";

const meta =
    {
        component: Button,
        title: "Primitive/Button",

        argTypes:
        {
            Appearance:
            {
                control: "select",
                options:
                [
                    "Primary",
                    "Icon",
                    "NavIcon",
                    "Link",
                    "Blue",
                    "SoftBlue",
                    "Hint",
                    "Red",
                    "RedFill",
                    "White",
                    "Cell",
                    "Close"
                ]
            },
            Disabled: { control: "boolean" },
            Loading: { control: "boolean" },
            Size:
            {
                control: "select",
                options:
                [
                    "ExtraSmall",
                    "Small",
                    "Medium",
                    "Large",
                    "Circle"
                ]
            }
        }
    } satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            Appearance: "Primary",
            Disabled: false,
            Loading: false,
            Size: "Medium",
            children: "Button"
        }
    };

export const AllVariants: Story =
    {
        render: () => (
            <View style={ {
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center"
            } }>
                <Button Appearance="Primary">Primary</Button>
                <Button Appearance="Blue">Blue</Button>
                <Button Appearance="SoftBlue">Soft Blue</Button>
                <Button Appearance="Red">Red</Button>
                <Button Appearance="RedFill">Red Fill</Button>
                <Button Appearance="White">White</Button>
                <Button Appearance="Hint">Hint</Button>
                <Button Appearance="Link">Link</Button>
                <Button Appearance="Cell">Cell</Button>
            </View>
        )
    };

export const Loading: Story =
    {
        args:
        {
            Appearance: "Primary",
            Loading: true,
            children: "Loading"
        }
    };

export const Disabled: Story =
    {
        args:
        {
            Appearance: "Primary",
            Disabled: true,
            children: "Disabled"
        }
    };
