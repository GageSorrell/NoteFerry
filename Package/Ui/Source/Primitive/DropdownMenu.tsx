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
import { Pressable, ScrollView, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";

import { CloneTrigger, type PopupAnchor, type PopupPlacement, Popup } from "./Popup.js";
import { MenuItem, MenuItemCheck, type MenuItemProps } from "./Menu.js";

export { MenuFooter as DropdownMenuFooter, MenuGroup as DropdownMenuGroup, MenuLabel as DropdownMenuLabel } from "./Menu.js";
export { Separator as DropdownMenuSeparator } from "./Separator.js";

interface DropdownMenuContextValue {
    readonly IsOpen: boolean;
    readonly SetIsOpen: (Open: boolean) => void;
    readonly AnchorRef: PopupAnchor;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

/** Exposed so `ContextMenu.tsx` can reuse this engine with a different trigger gesture. */
export const useDropdownMenuContext = (): DropdownMenuContextValue =>
{
    const Value = React.useContext(DropdownMenuContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `DropdownMenu` part was used outside of `<DropdownMenu>`.");
    }

    return Value;
};

export interface DropdownMenuProps {
    readonly Open?: boolean;
    readonly DefaultOpen?: boolean;
    readonly OnOpenChange?: (Open: boolean) => void;
    readonly children?: React.ReactNode;
}

export const DropdownMenu = ({ Open, DefaultOpen = false, OnOpenChange, children }: DropdownMenuProps): React.JSX.Element =>
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
        () => ({ IsOpen, SetIsOpen, AnchorRef }),
        [ IsOpen, SetIsOpen ],
    );

    return <DropdownMenuContext.Provider value={ ContextValue }>{ children }</DropdownMenuContext.Provider>;
};

export interface DropdownMenuTriggerProps {
    /** Clone `children` (e.g. a `Button`) instead of wrapping it in a second `Pressable` — see `CloneTrigger` in `Popup.tsx`. */
    readonly AsChild?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const DropdownMenuTrigger = ({ AsChild = false, Style, children }: DropdownMenuTriggerProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useDropdownMenuContext();
    const Toggle = React.useCallback(() => SetIsOpen(!IsOpen), [ IsOpen, SetIsOpen ]);

    if (AsChild)
    {
        return CloneTrigger(children as React.ReactElement<{ OnPress?: (Event: GestureResponderEvent) => void }>, Toggle, AnchorRef);
    }

    return (
        <Pressable ref={ AnchorRef } onPress={ Toggle } style={ Style }>
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
        throw new Error("[@notivex/ui] A `DropdownMenuItem`-family component was used outside of `<DropdownMenuContent>`.");
    }

    return Close;
};

export interface DropdownMenuContentProps {
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const DropdownMenuContent = ({ Placement = "Bottom", Style, children }: DropdownMenuContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useDropdownMenuContext();
    const Close = React.useCallback(() => SetIsOpen(false), [ SetIsOpen ]);

    return (
        <Popup IsVisible={ IsOpen } OnRequestClose={ Close } Anchor={ AnchorRef } Placement={ Placement } Style={ [ { minWidth: 128 }, Style ] }>
            <DropdownMenuCloseContext.Provider value={ Close }>
                <ScrollView style={ { maxHeight: 320 } } contentContainerStyle={ { paddingVertical: 4 } }>
                    { children }
                </ScrollView>
            </DropdownMenuCloseContext.Provider>
        </Popup>
    );
};

export interface DropdownMenuItemProps extends Omit<MenuItemProps, "OnPress"> {
    readonly OnSelect?: () => void;
    readonly CloseOnSelect?: boolean;
}

export const DropdownMenuItem = ({ OnSelect, CloseOnSelect = true, ...Rest }: DropdownMenuItemProps): React.JSX.Element =>
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

export interface DropdownMenuCheckboxItemProps extends Omit<MenuItemProps, "OnPress"> {
    readonly Checked?: boolean;
    readonly OnCheckedChange?: (Checked: boolean) => void;
    readonly CloseOnSelect?: boolean;
}

export const DropdownMenuCheckboxItem = ({
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

interface DropdownMenuRadioContextValue {
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Value: string) => void) | undefined;
}

const DropdownMenuRadioContext = React.createContext<DropdownMenuRadioContextValue | undefined>(undefined);

export interface DropdownMenuRadioGroupProps {
    readonly Value?: string;
    readonly OnValueChange?: (Value: string) => void;
    readonly children?: React.ReactNode;
}

export const DropdownMenuRadioGroup = ({ Value, OnValueChange, children }: DropdownMenuRadioGroupProps): React.JSX.Element =>
{
    const ContextValue = React.useMemo<DropdownMenuRadioContextValue>(() => ({ Value, OnValueChange }), [ Value, OnValueChange ]);

    return <DropdownMenuRadioContext.Provider value={ ContextValue }>{ children }</DropdownMenuRadioContext.Provider>;
};

export interface DropdownMenuRadioItemProps extends Omit<MenuItemProps, "OnPress"> {
    readonly Value: string;
    readonly CloseOnSelect?: boolean;
}

export const DropdownMenuRadioItem = ({ Value, CloseOnSelect = true, children, ...Rest }: DropdownMenuRadioItemProps): React.JSX.Element =>
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
