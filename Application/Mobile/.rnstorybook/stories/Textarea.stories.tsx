/**
 * @module noteferry/Storybook/Textarea
 * @internal
 *
 * @file      Textarea.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Textarea, type TextareaProps } from "@noteferry/ui/Primitive";

const ControlledTextarea = (Props: TextareaProps): React.JSX.Element =>
{
    const [ Value, OnChangeText ] = React.useState(Props.Value ?? "");

    return (
        <Textarea
            { ...{ ...Props, OnChangeText, Value } }
        />
    );
};

const meta =
    {
        argTypes:
        {
            Disabled: { control: "boolean" },
            NumberOfLines: { control: "number" }
        },
        component: ControlledTextarea,
        title: "Primitive/Textarea"
    } satisfies Meta<typeof ControlledTextarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        args:
        {
            NumberOfLines: 4,
            Placeholder: "Write something…"
        }
    };

export const Disabled: Story =
    {
        args:
        {
            Disabled: true,
            Value: "Read-only content."
        }
    };
