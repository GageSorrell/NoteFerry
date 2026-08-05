/**
 * Storybook stories for `@notivex/ui`'s `AlertModal` primitive.
 *
 * @module notivex/app/.rnstorybook/stories/AlertModal
 *
 * @file      AlertModal.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { AlertModal, Button, Dialog, DialogTrigger } from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";

const AlertModalExample = (): React.JSX.Element => (
    <Dialog>
        <DialogTrigger AsChild>
            <Button Variant="Red">Delete workspace…</Button>
        </DialogTrigger>
        <AlertModal
            OnTrigger={ () => new Promise((Resolve: (() => void)) => setTimeout(Resolve, 1200)) }
            Primary="Delete"
            Secondary="Cancel"
            Title="Delete this workspace?"
        />
    </Dialog>
);

const meta =
    {
        component: AlertModalExample,
        title: "Primitive/AlertModal"
    } satisfies Meta<typeof AlertModalExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { };
