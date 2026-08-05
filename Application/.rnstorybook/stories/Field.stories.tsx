/**
 * @module notivex/Storybook/Field
 * @internal
 *
 * @file      Field.stories.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    Input
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";

const FieldExample = (): React.JSX.Element => (
    <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
            <Field>
                <FieldContent>
                    <FieldLabel>Name</FieldLabel>
                    <Input Placeholder="Ada Lovelace" />
                    <FieldDescription>
                        Shown on your public profile.
                    </FieldDescription>
                </FieldContent>
            </Field>
            <Field Invalid>
                <FieldContent>
                    <FieldLabel>
                        Email
                    </FieldLabel>
                    <Input
                        Invalid
                        Placeholder="you@example.com"
                    />
                    <FieldError Errors={ [ { Message: "Enter a valid email address." } ] } />
                </FieldContent>
            </Field>
        </FieldGroup>
    </FieldSet>
);

const meta =
    {
        component: FieldExample,
        title: "Primitive/Field"
    } satisfies Meta<typeof FieldExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FormLayout: Story = { };
