/**
 * Ported from `@notion-kit/ui`'s `primitives/context-menu.tsx`. Source
 * opened on right-click; RN has no right-click, so `ContextMenuTrigger`
 * opens on long-press instead. Everything else — content, items, checkbox/
 * radio items, groups, separators — is `DropdownMenu.tsx`'s engine reused
 * as-is, since the two are otherwise identical (a menu anchored to a
 * trigger element).
 *
 * @module @notivex/ui/Primitive/ContextMenu
 *
 * @file      ContextMenu.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useDropdownMenuContext } from "./DropdownMenu.js";

export {
    DropdownMenu as ContextMenu,
    type DropdownMenuProps as ContextMenuProps,
    DropdownMenuContent as ContextMenuContent,
    type DropdownMenuContentProps as ContextMenuContentProps,
    DropdownMenuItem as ContextMenuItem,
    type DropdownMenuItemProps as ContextMenuItemProps,
    DropdownMenuCheckboxItem as ContextMenuCheckboxItem,
    type DropdownMenuCheckboxItemProps as ContextMenuCheckboxItemProps,
    DropdownMenuRadioGroup as ContextMenuRadioGroup,
    type DropdownMenuRadioGroupProps as ContextMenuRadioGroupProps,
    DropdownMenuRadioItem as ContextMenuRadioItem,
    type DropdownMenuRadioItemProps as ContextMenuRadioItemProps,
    DropdownMenuGroup as ContextMenuGroup,
    DropdownMenuLabel as ContextMenuLabel,
    DropdownMenuFooter as ContextMenuFooter,
    DropdownMenuSeparator as ContextMenuSeparator,
} from "./DropdownMenu.js";

export interface ContextMenuTriggerProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const ContextMenuTrigger = ({ Style, children }: ContextMenuTriggerProps): React.JSX.Element =>
{
    const { SetIsOpen, AnchorRef } = useDropdownMenuContext();

    return (
        <Pressable ref={ AnchorRef } onLongPress={ () => SetIsOpen(true) } delayLongPress={ 350 } style={ Style }>
            { children }
        </Pressable>
    );
};
