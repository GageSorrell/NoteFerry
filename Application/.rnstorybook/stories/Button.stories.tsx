/**
 * @module notivex/Storybook/Button
 * @internal
 *
 * @file      Button.stories.ts
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
            Disabled: { control: "boolean" },
            Loading: { control: "boolean" },
            Size:
            {
                control: "select",
                options:
                [
                    "ExtraSmall", "Small", "Medium", "Large", "Circle"
                ]
            },
            Variant:
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
            }
        }
    } satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            Disabled: false,
            Loading: false,
            Size: "Medium",
            Variant: "Primary",
            children: "Button"
        }
    };

export const AllVariants: Story =
    {
        render: () => (
            <View style={ { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" } }>
                <Button Variant="Primary">Primary</Button>
                <Button Variant="Blue">Blue</Button>
                <Button Variant="SoftBlue">Soft Blue</Button>
                <Button Variant="Red">Red</Button>
                <Button Variant="RedFill">Red Fill</Button>
                <Button Variant="White">White</Button>
                <Button Variant="Hint">Hint</Button>
                <Button Variant="Link">Link</Button>
                <Button Variant="Cell">Cell</Button>
            </View>
        )
    };

export const Loading: Story =
    {
        args:
        {
            Loading: true,
            Variant: "Primary",
            children: "Loading"
        }
    };

export const Disabled: Story =
    {
        args:
        {
            Disabled: true,
            Variant: "Primary",
            children: "Disabled"
        }
    };
