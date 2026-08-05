/**
 * Storybook stories for `@notivex/ui`'s `Dialog` primitive.
 *
 * @module notivex/app/.rnstorybook/stories/Dialog
 *
 * @file      Dialog.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Button,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";

const DialogExample = (): React.JSX.Element => (
    <Dialog>
        <DialogTrigger AsChild>
            <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete this page?</DialogTitle>
                <DialogDescription>This can be undone from Trash for 30 days.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose Size="Small"
                    Style={ { width: "100%" } }
                    Variant="RedFill">
                    Delete
                </DialogClose>
                <DialogClose Size="Small"
                    Style={ { width: "100%" } }>
                    Cancel
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const meta =
    {
        component: DialogExample,
        title: "Primitive/Dialog"
    } satisfies Meta<typeof DialogExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { };
