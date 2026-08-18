/**
 * Storybook stories for `@notivex/ui`'s `Form` primitive — `react-hook-form`
 * wired into `Field`'s layout via `FormField`/`FormItem`/`FormLabel`/
 * `FormMessage`.
 *
 * @module notivex/app/.rnstorybook/stories/Form
 *
 * @file      Form.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Button,
    Form,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input
} from "@notivex/ui/Primitive";
import { type ControllerRenderProps, useForm } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

interface FormValues
{
    readonly Name: string;
}

interface RenderArgument
{
    readonly field: ControllerRenderProps<FormValues, "Name">;
}

const FormExample = (): React.JSX.Element =>
{
    const Methods = useForm<FormValues>({ defaultValues: { Name: "" } });

    return (
        <View style={ { width: 280 } }>
            <Form { ...Methods }>
                <FormField
                    control={ Methods.control }
                    name="Name"
                    render={ ({ field }: RenderArgument) =>
                        <FormItem>
                            <FormLabel>
                                Name
                            </FormLabel>
                            <Input
                                OnChangeText={ field.onChange }
                                Placeholder="Ada Lovelace"
                                Value={ field.value } />
                            <FormDescription>
                                Shown on your public profile.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    }
                    rules={ { required: "Name is required." } }
                />
                <Button OnPress={ Methods.handleSubmit(() => {}) }
                    Style={ { marginTop: 12 } }>
                    Save
                </Button>
            </Form>
        </View>
    );
};

const meta =
    {
        component: FormExample,
        title: "Primitive/Form"
    } satisfies Meta<typeof FormExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Form"
    } as const;
