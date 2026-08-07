/**
 * Storybook stories for `@notivex/ui`'s `Command` primitive — the
 * command-palette skin over `Autocomplete`, hosted in a `Dialog` via
 * `CommandDialog`.
 *
 * @module notivex/app/.rnstorybook/stories/Command
 *
 * @file      Command.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Button,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";

const CommandExample = (): React.JSX.Element =>
{
    const [ Open, SetOpen ] = React.useState(false);

    return (
        <>
            <Button OnPress={ () => SetOpen(true) }>Open command palette</Button>
            <CommandDialog OnOpenChange={ SetOpen }
                Open={ Open }>
                <CommandInput AutoFocus />
                <CommandList>
                    <CommandEmpty />
                    <CommandGroup Heading="Actions">
                        <CommandItem OnSelect={ () => SetOpen(false) }
                            Shortcut="⌘N"
                            Value="New page" />
                        <CommandItem OnSelect={ () => SetOpen(false) }
                            Shortcut="⌘K"
                            Value="Search" />
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup Heading="Navigate">
                        <CommandItem OnSelect={ () => SetOpen(false) }
                            Value="Go to Settings" />
                        <CommandItem OnSelect={ () => SetOpen(false) }
                            Value="Go to Trash" />
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
};

const meta =
    {
        component: CommandExample,
        title: "Primitive/Command"
    } satisfies Meta<typeof CommandExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "Command"
    } as const;
