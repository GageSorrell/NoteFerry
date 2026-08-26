/**
 * Ported from `@notion-kit/ui`'s `primitives/popover.tsx`. Source built
 * this on `@base-ui/react/popover`'s trigger/positioner/popup primitives;
 * here `Popup.tsx` plays that role, anchored to `PopoverTrigger`'s
 * measured position via `react-native-popover-view`.
 *
 * @module @noteferry/ui/Primitive/Popover
 *
 * @file      Popover.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Spacing from "../Token/Spacing.js";
import { type ButtonProps, CloseButton } from "./Button.js";
import { CloneTrigger, Popup, type PopupAnchor, type PopupPlacement } from "./Popup.js";
import {
    type GestureResponderEvent,
    Pressable,
    type StyleProp,
    View,
    type ViewStyle
} from "react-native";
import { useToken } from "../ThemeProvider.js";

interface PopoverContextValue
{
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
        throw new Error("[@noteferry/ui] A `Popover` part was used outside of `<Popover>`.");
    }

    return Value;
};

/** {@inheritDoc Popover} */
export interface PopoverProps extends React.PropsWithChildren
{
    readonly Open?: boolean;
    readonly DefaultOpen?: boolean;
    readonly OnOpenChange?: (Open: boolean) => void;
}

export/**
       * A state provider that coordinates a compound `Popover`'s trigger, anchor, and open state.
       *
       * @category Component
       * @since 1.0.0
       */
const Popover = ({ Open, DefaultOpen = false, OnOpenChange, children }: PopoverProps): React.JSX.Element =>
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
        () => ({ AnchorRef, IsOpen, SetIsOpen }),
        [ IsOpen, SetIsOpen ]
    );

    return (
        <PopoverContext.Provider value={ ContextValue }>
            { children }
        </PopoverContext.Provider>
    );
};

/** {@inheritDoc PopoverTrigger} */
export interface PopoverTriggerProps extends React.PropsWithChildren
{
    /**
     * Clone `children` (e.g. a `Button`) instead of wrapping it in a second `Pressable`
     *
     * @see {@link CloneTrigger}
     */
    readonly AsChild?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A pressable control that toggles and anchors its surrounding `Popover`.
       *
       * @category Component
       * @since 1.0.0
       */
const PopoverTrigger = ({ AsChild = false, Style, children }: PopoverTriggerProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = usePopoverContext();
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
            onPress={ Toggle }
            ref={ AnchorRef }
            style={ Style }>
            { children }
        </Pressable>
    );
};

/** {@inheritDoc PopoverContent} */
export interface PopoverContentProps extends React.PropsWithChildren
{
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A positioned popup container for a `Popover`'s content.
       *
       * @category Component
       * @since 1.0.0
       */
const PopoverContent = ({ Placement = "Bottom", Style, children }: PopoverContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = usePopoverContext();
    const { [Spacing.S]: Padding } = useToken(Spacing.S);

    return (
        <Popup
            Anchor={ AnchorRef }
            IsVisible={ IsOpen }
            OnRequestClose={ () => SetIsOpen(false) }
            Placement={ Placement }
            Style={ [ { padding: Padding, width: 288 }, Style ] }>
            <View>
                { children }
            </View>
        </Popup>
    );
};

/** {@inheritDoc PopoverClose} */
export interface PopoverCloseProps
{
    readonly OnPress?: ButtonProps["OnPress"];
}

export/**
       * A close button that dismisses its surrounding `Popover` after invoking the supplied press handler.
       *
       * @category Component
       * @since 1.0.0
       */
const PopoverClose = ({ OnPress }: PopoverCloseProps): React.JSX.Element =>
{
    const { SetIsOpen } = usePopoverContext();

    return (
        <CloseButton
            OnPress={ (Event: GestureResponderEvent) =>
            {
                OnPress?.(Event);
                SetIsOpen(false);
            } }
        />
    );
};
