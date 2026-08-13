/**
 * Ported from `@notion-kit/ui`'s `primitives/dropdown-menu.tsx`, built on
 * `Popup.tsx` + `Menu.tsx` instead of `@base-ui/react/menu`. Source's
 * nested `Menu.SubmenuRoot`/`SubmenuTrigger` flyout submenus were not
 * ported — a hover-revealed nested flyout has no clean touch-UI
 * equivalent, and no in-scope consumer needs one; a nested `DropdownMenu`
 * triggered by its own `DropdownMenuItem` is the fallback for that case.
 * `ContextMenu.tsx` reuses everything here except the trigger gesture.
 *
 * @module @notivex/ui/Primitive/DropdownMenu
 *
 * @file      DropdownMenu.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { CloneTrigger, Popup, type PopupAnchor, type PopupPlacement } from "./Popup.js";
import {
    type GestureResponderEvent,
    ScrollView,
    type StyleProp,
    type ViewStyle
} from "react-native";
import { MenuItem, MenuItemCheck, type MenuItemProps } from "./Menu.js";
import { Pressable } from "./Pressable.js";
import type { Thunk } from "@sorrell/utility/Function";

export {
    MenuFooter as DropdownMenuFooter,
    MenuGroup as DropdownMenuGroup,
    MenuLabel as DropdownMenuLabel
} from "./Menu.js";
export { Separator as DropdownMenuSeparator } from "./Separator.js";

interface DropdownMenuContextValue
{
    readonly IsOpen: boolean;
    readonly SetIsOpen: (Open: boolean) => void;
    readonly AnchorRef: PopupAnchor;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

export/**
       * Exposed so `ContextMenu.tsx` can reuse this engine with a different trigger gesture.
       *
       * @category Hook
       * @since 1.0.0
       */
const useDropdownMenuContext = (): DropdownMenuContextValue =>
{
    const Value = React.useContext(DropdownMenuContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `DropdownMenu` part was used outside of `<DropdownMenu>`.");
    }

    return Value;
};

/** {@inheritDoc DropdownMenu} */
export interface DropdownMenuProps extends React.PropsWithChildren
{
    readonly Open?: boolean;
    readonly DefaultOpen?: boolean;
    readonly OnOpenChange?: (Open: boolean) => void;
}

export/**
       * A state provider that coordinates a `DropdownMenu`'s trigger, popup anchor, and open state.
       *
       * @category Component
       * @since 1.0.0
       */
const DropdownMenu = ({
    Open,
    DefaultOpen = false,
    OnOpenChange,
    children
}: DropdownMenuProps): React.JSX.Element =>
{
    const [ UncontrolledOpen, SetUncontrolledOpen ] = React.useState(DefaultOpen);
    const IsOpen = Open ?? UncontrolledOpen;
    const AnchorRef = React.useRef<React.Component>(null);

    const SetIsOpen = React.useCallback((NextOpen: boolean) =>
    {
        SetUncontrolledOpen(NextOpen);
        OnOpenChange?.(NextOpen);
    }, [ OnOpenChange ]);

    const ContextValue = React.useMemo<DropdownMenuContextValue>(
        () => ({ AnchorRef, IsOpen, SetIsOpen }),
        [ IsOpen, SetIsOpen ]
    );

    return (
        <DropdownMenuContext.Provider value={ ContextValue }>
            { children }
        </DropdownMenuContext.Provider>
    );
};

/** {@inheritDoc DropdownMenuTrigger} */
export interface DropdownMenuTriggerProps extends React.PropsWithChildren
{
    /**
     * Clone `children` (e.g. a `Button`) instead of wrapping it in a second `Pressable`
     *
     * @see {@link CloneTrigger}
     */
    readonly AsChild?: boolean;
    readonly AccessibilityLabel?: string;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A pressable control that toggles and anchors its surrounding `DropdownMenu`.
       *
       * @category Component
       * @since 1.0.0
       */
const DropdownMenuTrigger = ({
    AsChild = false,
    AccessibilityLabel,
    Disabled = false,
    Style,
    children
}: DropdownMenuTriggerProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useDropdownMenuContext();
    const Toggle = React.useCallback(() => SetIsOpen(!IsOpen), [ IsOpen, SetIsOpen ]);

    if (AsChild)
    {
        return CloneTrigger(
            children as React.ReactElement<{ OnPress?: (Event: GestureResponderEvent) => void }>,
            Toggle,
            AnchorRef
        );
    }

    return (
        <Pressable
            Accessibility={ {
                Label: AccessibilityLabel,
                Role: "button",
                State: { disabled: Disabled, expanded: IsOpen }
            } }
            Disabled={ Disabled }
            OnPress={ Toggle }
            ref={ AnchorRef }
            style={ [ Disabled ? { opacity: 0.3 } : undefined, Style ] }>
            { children }
        </Pressable>
    );
};

const DropdownMenuCloseContext = React.createContext<(() => void) | undefined>(undefined);

const useDropdownMenuClose = (): (() => void) =>
{
    const Close = React.useContext(DropdownMenuCloseContext);

    if (Close === undefined)
    {
        throw new Error(
            "[@notivex/ui] A `DropdownMenuItem`-family component was used outside of `<DropdownMenuContent>`."
        );
    }

    return Close;
};

/** {@inheritDoc DropdownMenuContent} */
export interface DropdownMenuContentProps extends React.PropsWithChildren
{
    readonly MatchTriggerWidth?: boolean;
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A scrollable popup that displays a `DropdownMenu`'s items.
       *
       * @category Component
       * @since 1.0.0
       */
const DropdownMenuContent = ({
    MatchTriggerWidth = true,
    Placement = "Bottom",
    Style,
    children
}: DropdownMenuContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useDropdownMenuContext();
    const Close = React.useCallback(() => SetIsOpen(false), [ SetIsOpen ]);

    return (
        <Popup
            Anchor={ AnchorRef }
            IsVisible={ IsOpen }
            MatchAnchorWidth={ MatchTriggerWidth }
            OnRequestClose={ Close }
            Placement={ Placement }
            Style={ [ { minWidth: 128 }, Style ] }>
            <DropdownMenuCloseContext.Provider value={ Close }>
                <ScrollView
                    contentContainerStyle={ { paddingVertical: 4 } }
                    style={ { maxHeight: 320 } }>
                    { children }
                </ScrollView>
            </DropdownMenuCloseContext.Provider>
        </Popup>
    );
};

/** {@inheritDoc DropdownMenuItem} */
export interface DropdownMenuItemProps extends Omit<MenuItemProps, "OnPress">
{
    readonly OnSelect?: Thunk;
    readonly CloseOnSelect?: boolean;
}

export/**
       * A `DropdownMenu` action that optionally closes the menu after selection.
       *
       * @category Component
       * @since 1.0.0
       */
const DropdownMenuItem = ({
    OnSelect,
    CloseOnSelect = true,
    ...Rest
}: DropdownMenuItemProps): React.JSX.Element =>
{
    const Close = useDropdownMenuClose();

    return (
        <MenuItem
            { ...Rest }
            OnPress={ () =>
            {
                OnSelect?.();

                if (CloseOnSelect)
                {
                    Close();
                }
            } }
        />
    );
};

/** {@inheritDoc DropdownMenuCheckboxItem} */
export interface DropdownMenuCheckboxItemProps extends Omit<MenuItemProps, "OnPress">
{
    readonly Checked?: boolean;
    readonly OnCheckedChange?: (Checked: boolean) => void;
    readonly CloseOnSelect?: boolean;
}

export/**
       * A boolean `DropdownMenu` option that displays a check mark when selected.
       *
       * @category Component
       * @since 1.0.0
       */
const DropdownMenuCheckboxItem = ({
    Checked = false,
    OnCheckedChange,
    CloseOnSelect = false,
    children,
    ...Rest
}: DropdownMenuCheckboxItemProps): React.JSX.Element =>
{
    const Close = useDropdownMenuClose();

    return (
        <MenuItem
            { ...Rest }
            OnPress={ () =>
            {
                OnCheckedChange?.(!Checked);

                if (CloseOnSelect)
                {
                    Close();
                }
            } }
        >
            { Checked && <MenuItemCheck /> }
            { children }
        </MenuItem>
    );
};

interface DropdownMenuRadioContextValue
{
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Value: string) => void) | undefined;
}

const DropdownMenuRadioContext = React.createContext<DropdownMenuRadioContextValue | undefined>(undefined);

/** {@inheritDoc DropdownMenuRadioGroup} */
export interface DropdownMenuRadioGroupProps extends React.PropsWithChildren
{
    readonly Value?: string;
    readonly OnValueChange?: (Value: string) => void;
}

export/**
       * Coordinates the selected value and change handler for a set of `DropdownMenuRadioItem` components.
       *
       * @category Component
       * @since 1.0.0
       */
const DropdownMenuRadioGroup = ({
    Value,
    OnValueChange,
    children
}: DropdownMenuRadioGroupProps): React.JSX.Element =>
{
    const ContextValue = React.useMemo<DropdownMenuRadioContextValue>(
        () => ({ OnValueChange, Value }),
        [ Value, OnValueChange ]
    );

    return (
        <DropdownMenuRadioContext.Provider value={ ContextValue }>
            { children }
        </DropdownMenuRadioContext.Provider>
    );
};

/** {@inheritDoc DropdownMenuRadioItem} */
export interface DropdownMenuRadioItemProps extends Omit<MenuItemProps, "OnPress">
{
    readonly Value: string;
    readonly CloseOnSelect?: boolean;
}

export/**
       * A mutually exclusive `DropdownMenu` option that displays a check mark when selected.
       *
       * @category Component
       * @since 1.0.0
       */
const DropdownMenuRadioItem = ({
    Value,
    CloseOnSelect = true,
    children,
    ...Rest
}: DropdownMenuRadioItemProps): React.JSX.Element =>
{
    const RadioContext = React.useContext(DropdownMenuRadioContext);
    const Close = useDropdownMenuClose();
    const Checked = RadioContext?.Value === Value;

    return (
        <MenuItem
            { ...Rest }
            OnPress={ () =>
            {
                RadioContext?.OnValueChange?.(Value);

                if (CloseOnSelect)
                {
                    Close();
                }
            } }
        >
            { Checked && <MenuItemCheck /> }
            { children }
        </MenuItem>
    );
};
