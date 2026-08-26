/**
 * Storybook stories for `@noteferry/ui`'s `DropdownMenu` primitive (and the
 * `Menu` building blocks it composes: `MenuItem`, `MenuLabel`, ...).
 *
 * @module noteferry/app/.rnstorybook/stories/DropdownMenu
 *
 * @file      DropdownMenu.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Button,
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@noteferry/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";

const DropdownMenuExample = (): React.JSX.Element =>
{
    const [ wrapEnabled, setWrapEnabled ] = React.useState(true);
    const [ sort, setSort ] = React.useState("name");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger AsChild>
                <Button>Options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem Label="Rename"
                        OnSelect={ () => {} } />
                    <DropdownMenuItem Label="Duplicate"
                        OnSelect={ () => {} } />
                    <DropdownMenuItem Label="Delete"
                        OnSelect={ () => {} }
                        Variant="Error" />
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuLabel>View</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem Checked={ wrapEnabled }
                        Label="Wrap text"
                        OnCheckedChange={ setWrapEnabled } />
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuRadioGroup OnValueChange={ setSort }
                        Value={ sort }>
                        <DropdownMenuRadioItem Label="Name"
                            Value="name" />
                        <DropdownMenuRadioItem Label="Date modified"
                            Value="date" />
                    </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const meta =
    {
        component: DropdownMenuExample,
        title: "Primitive/DropdownMenu"
    } satisfies Meta<typeof DropdownMenuExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "DropdownMenu"
    } as const;
