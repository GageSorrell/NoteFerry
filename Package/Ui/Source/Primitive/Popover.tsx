/**
 * Ported from `@notion-kit/ui`'s `primitives/popover.tsx`. Source built
 * this on `@base-ui/react/popover`'s trigger/positioner/popup primitives;
 * here `Popup.tsx` plays that role, anchored to `PopoverTrigger`'s
 * measured position via `react-native-popover-view`.
 *
 * @module @notivex/ui/Primitive/Popover
 *
 * @file      Popover.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";

import { useSpacing } from "../ThemeProvider.js";
import * as Spacing from "../Token/Spacing.js";
import { CloseButton, type ButtonProps } from "./Button.js";
import { CloneTrigger, type PopupAnchor, type PopupPlacement, Popup } from "./Popup.js";

interface PopoverContextValue {
    readonly IsOpen: boolean;
    readonly SetIsOpen: (Open: boolean) => void;
    readonly AnchorRef: PopupAnchor;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined);

const usePopoverContext = (): PopoverContextValue =>
{
    const Value = React.useContext(PopoverContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `Popover` part was used outside of `<Popover>`.");
    }

    return Value;
};

export interface PopoverProps {
    readonly Open?: boolean;
    readonly DefaultOpen?: boolean;
    readonly OnOpenChange?: (Open: boolean) => void;
    readonly children?: React.ReactNode;
}

export const Popover = ({ Open, DefaultOpen = false, OnOpenChange, children }: PopoverProps): React.JSX.Element =>
{
    const [ UncontrolledOpen, SetUncontrolledOpen ] = React.useState(DefaultOpen);
    const IsOpen = Open ?? UncontrolledOpen;
    const AnchorRef = React.useRef<React.Component>(null);

    const SetIsOpen = React.useCallback((NextOpen: boolean) =>
    {
        SetUncontrolledOpen(NextOpen);
        OnOpenChange?.(NextOpen);
    }, [ OnOpenChange ]);

    const ContextValue = React.useMemo<PopoverContextValue>(
        () => ({ IsOpen, SetIsOpen, AnchorRef }),
        [ IsOpen, SetIsOpen ],
    );

    return <PopoverContext.Provider value={ ContextValue }>{ children }</PopoverContext.Provider>;
};

export interface PopoverTriggerProps {
    /** Clone `children` (e.g. a `Button`) instead of wrapping it in a second `Pressable` — see `CloneTrigger` in `Popup.tsx`. */
    readonly AsChild?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const PopoverTrigger = ({ AsChild = false, Style, children }: PopoverTriggerProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = usePopoverContext();
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

export interface PopoverContentProps {
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const PopoverContent = ({ Placement = "Bottom", Style, children }: PopoverContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = usePopoverContext();
    const Padding = useSpacing(Spacing.Small);

    return (
        <Popup
            IsVisible={ IsOpen }
            OnRequestClose={ () => SetIsOpen(false) }
            Anchor={ AnchorRef }
            Placement={ Placement }
            Style={ [ { width: 288, padding: Padding }, Style ] }
        >
            <View>{ children }</View>
        </Popup>
    );
};

export interface PopoverCloseProps {
    readonly OnPress?: ButtonProps["OnPress"];
}

export const PopoverClose = ({ OnPress }: PopoverCloseProps): React.JSX.Element =>
{
    const { SetIsOpen } = usePopoverContext();

    return (
        <CloseButton
            OnPress={ (Event) =>
            {
                OnPress?.(Event);
                SetIsOpen(false);
            } }
        />
    );
};
