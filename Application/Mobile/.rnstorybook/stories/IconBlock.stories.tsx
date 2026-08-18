/**
 * Storybook stories for `@notivex/ui`'s `IconBlock` primitive — a page/
 * database icon (an emoji, a Lucide icon, a remote image, or a letter
 * fallback), sized and rounded consistently wherever an icon appears.
 *
 * @module notivex/app/.rnstorybook/stories/IconBlock
 *
 * @file      IconBlock.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Meta, StoryObj } from "@storybook/react-native";
import { IconBlock } from "@notivex/ui/Block";
import { View } from "react-native";

const meta =
    {
        argTypes:
        {
            Size:
            {
                control: "select",
                options:
                [
                    "Small",
                    "Medium",
                    "Large",
                    "ExtraLarge"
                ]
            }
        },
        component: IconBlock,
        title: "Block/IconBlock"
    } satisfies Meta<typeof IconBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            Icon: { Src: "book-open", Type: "Lucide" },
            Size: "Medium"
        }
    } as const;

export const Types: Story =
    {
        args:
        {
            Icon: { Src: "book-open", Type: "Lucide" },
            Size: "Medium"
        },
        render: () => (
            <View style={ {
                alignItems: "center",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 16
            } }>
                <IconBlock
                    Icon={ {
                        Src: "📚",
                        Type: "Emoji"
                    } }
                    Size="Large"
                />
                <IconBlock
                    Icon={ {
                        Color: "#337EA9",
                        Src: "calendar",
                        Type: "Lucide"
                    } }
                    Size="Large"
                />
                <IconBlock
                    Icon={ {
                        Src: "https://picsum.photos/seed/notivex/128",
                        Type: "Url"
                    } }
                    Size="Large"
                />
                <IconBlock
                    Icon={ {
                        Src: "Reading List",
                        Type: "Text"
                    } }
                    Size="Large"
                />
            </View>
        )
    };

export const Sizes: Story =
    {
        args:
        {
            Icon: { Src: "book-open", Type: "Lucide" },
            Size: "Medium"
        },
        render: () => (
            <View style={ {
                alignItems: "center",
                flexDirection: "row",
                gap: 12
            } }>
                <IconBlock
                    Icon={ {
                        Src: "book-open",
                        Type: "Lucide"
                    } }
                    Size="Small"
                />
                <IconBlock
                    Icon={ {
                        Src: "book-open",
                        Type: "Lucide"
                    } }
                    Size="Medium"
                />
                <IconBlock
                    Icon={ {
                        Src: "book-open",
                        Type: "Lucide"
                    } }
                    Size="Large"
                />
                <IconBlock
                    Icon={ {
                        Src: "book-open",
                        Type: "Lucide"
                    } }
                    Size="ExtraLarge"
                />
            </View>
        )
    };
