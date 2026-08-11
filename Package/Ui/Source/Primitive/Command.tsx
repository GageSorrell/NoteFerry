/**
 * Ported from `@notion-kit/ui`'s `primitives/command.tsx` — a thin,
 * command-palette-flavored skin over `Autocomplete.tsx`'s engine, exactly
 * as in source. `Command` itself is host-agnostic (renders its content
 * `Inline`, matching source's `AutocompleteContent variant="inline"`
 * usage); `CommandDialog` is the common case, hosting it in `Dialog.tsx`'s
 * centered modal. A future full-screen `BottomSheet`-hosted variant (for
 * the `Sidebar` preset's `SearchCommand`, per the port plan) can reuse
 * `Command` the same way. Selecting an item does not auto-close its host —
 * matching cmdk/shadcn precedent, the consumer's `OnSelect` handler is
 * expected to close it (e.g. via `CommandDialog`'s own `OnOpenChange`).
 *
 * @module @notivex/ui/Primitive/Command
 *
 * @file      Command.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Autocomplete,
    AutocompleteContent,
    AutocompleteEmpty,
    type AutocompleteFilter,
    AutocompleteGroup,
    AutocompleteInput,
    AutocompleteItem,
    type AutocompleteItemProps,
    AutocompleteLabel,
    AutocompleteList
} from "./Autocomplete.js";
import { Dialog, DialogContent, type DialogProps } from "./Dialog.js";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import { MenuItemShortcut } from "./Menu.js";

export { AutocompleteSeparator as CommandSeparator } from "./Autocomplete.js";

/** {@inheritDoc Command} */
export interface CommandProps extends React.PropsWithChildren
{
    readonly Query?: string | undefined;
    readonly DefaultQuery?: string | undefined;
    readonly OnQueryChange?: ((Query: string) => void) | undefined;
    readonly Filter?: AutocompleteFilter | undefined;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A searchable command-list container built on the `Autocomplete` filtering engine.
       *
       * @category Component
       * @since 1.0.0
       */
const Command = ({
    Query,
    DefaultQuery,
    OnQueryChange,
    Filter,
    Style,
    children
}: CommandProps): React.JSX.Element =>
    <Autocomplete { ...{ DefaultQuery, Filter, OnQueryChange, Query } }>
        <AutocompleteContent
            Style={ [ Styles.Root, Style ] }
            Variant="Inline">
            { children }
        </AutocompleteContent>
    </Autocomplete>;

/** {@inheritDoc CommandInput} */
export interface CommandInputProps
{
    readonly Placeholder?: string;
    readonly AutoFocus?: boolean;
}

export/**
       * The search field used to filter commands in a `Command` list.
       *
       * @category Component
       * @since 1.0.0
       */
const CommandInput = ({
    AutoFocus,
    Placeholder = "Search for a command to run…"
}: CommandInputProps): React.JSX.Element =>
    <AutocompleteInput
        { ...{ AutoFocus, Placeholder } }
        OpenOnFocus={ false }
        Style={ Styles.Input }
    />;

/** {@inheritDoc CommandList} */
export interface CommandListProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A scrollable container for `Command` groups and items.
       *
       * @category Component
       * @since 1.0.0
       */
const CommandList = ({ Style, children }: CommandListProps): React.JSX.Element =>
    <AutocompleteList Style={ Style }>{ children }</AutocompleteList>;

/** {@inheritDoc CommandGroup} */
export interface CommandGroupProps extends React.PropsWithChildren
{
    readonly Heading?: React.ReactNode;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * Groups related `Command` items under an optional heading.
       *
       * @category Component
       * @since 1.0.0
       */
const CommandGroup = ({ Heading, Style, children }: CommandGroupProps): React.JSX.Element =>
    <AutocompleteGroup Style={ Style }>
        { Heading !== undefined && <AutocompleteLabel title={ Heading } /> }
        { children }
    </AutocompleteGroup>;

/** {@inheritDoc CommandItem} */
export interface CommandItemProps extends AutocompleteItemProps
{
    readonly Shortcut?: React.ReactNode;
}

export/**
       * A searchable command option with optional shortcut content.
       *
       * @category Component
       * @since 1.0.0
       */
const CommandItem = ({ Shortcut, children, ...Rest }: CommandItemProps): React.JSX.Element | null => (
    <AutocompleteItem { ...Rest }>
        { children }
        { Shortcut !== undefined && <MenuItemShortcut>{ Shortcut }</MenuItemShortcut> }
    </AutocompleteItem>
);

export/** {@inheritDoc AutocompleteEmpty} */
const CommandEmpty = AutocompleteEmpty;

/** {@inheritDoc CommandDialog} */
export interface CommandDialogProps extends
    DialogProps,
    Pick<CommandProps, "Query" | "DefaultQuery" | "OnQueryChange" | "Filter">,
    React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * `Command`, hosted in a centered `Dialog` — the common command-palette shape.
       *
       * @category Component
       * @since 1.0.0
       */
const CommandDialog = ({
    Open,
    DefaultOpen,
    OnOpenChange,
    Query,
    DefaultQuery,
    OnQueryChange,
    Filter,
    Style,
    children
}: CommandDialogProps): React.JSX.Element =>
    <Dialog { ...{ DefaultOpen, OnOpenChange, Open } }>
        <DialogContent
            HideClose
            Style={ Styles.DialogContent }>
            <Command { ...{ DefaultQuery, Filter, OnQueryChange, Query, Style } }>
                { children }
            </Command>
        </DialogContent>
    </Dialog>;

const Styles = StyleSheet.create({
    DialogContent:
    {
        maxWidth: 480,
        overflow: "hidden",
        padding: 0,
        width: "92%"
    },
    Input:
    {
        marginBottom: 4
    },
    Root:
    {
        width: "100%"
    }
});
