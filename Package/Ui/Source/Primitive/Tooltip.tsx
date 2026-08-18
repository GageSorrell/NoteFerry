/**
 * Ported from `@notion-kit/ui`'s `primitives/tooltip.tsx`. Source's
 * `TooltipTrigger` opened on pointer hover (`@base-ui/react/tooltip`'s
 * `delayed-open`); RN touch devices have no hover, so `TooltipTrigger`
 * opens on long-press there, and on web (where `Pressable`'s
 * `onHoverIn`/`onHoverOut` map to real `mouseenter`/`mouseleave`) it also
 * opens on hover — both wired unconditionally, since the handler for
 * whichever event doesn't apply on a given platform is simply never
 * called. There's no `TooltipProvider` — a shared open/delay group had no
 * clean RN equivalent and no in-scope consumer needed it.
 *
 * @module @notivex/ui/Primitive/Tooltip
 *
 * @file      Tooltip.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    type ImageStyle,
    Pressable,
    type StyleProp,
    type TextStyle,
    type ViewStyle
} from "react-native";
import { Popup, type PopupAnchor, type PopupPlacement } from "./Popup.js";
import { Image } from "expo-image";
import { LabelText } from "./Text.js";
import type { Thunk } from "@sorrell/effect/Function";

interface TooltipContextValue
{
    readonly IsOpen: boolean;
    readonly Show: Thunk;
    readonly Hide: Thunk;
    readonly AnchorRef: PopupAnchor;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

const useTooltipContext = (): TooltipContextValue =>
{
    const Value = React.useContext(TooltipContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `Tooltip` part was used outside of `<Tooltip>`.");
    }

    return Value;
};

/** {@inheritDoc Tooltip} */
export interface TooltipProps extends React.PropsWithChildren
{
    readonly Disabled?: boolean | undefined;
}

export/**
       * Coordinates the visibility and anchor of a tooltip shown on hover or long press.
       *
       * @category Component
       * @since 1.0.0
       */
const Tooltip = ({ Disabled = false, children }: TooltipProps): React.JSX.Element =>
{
    const [ IsOpen, SetIsOpen ] = React.useState(false);
    const AnchorRef = React.useRef<React.Component>(null);

    const Show = React.useCallback(() =>
    {
        if (!Disabled)
        {
            SetIsOpen(true);
        }
    }, [ Disabled ]);

    const Hide = React.useCallback(() => SetIsOpen(false), []);

    const ContextValue = React.useMemo<TooltipContextValue>(
        () => ({ AnchorRef, Hide, IsOpen, Show }),
        [ Hide, IsOpen, Show ]
    );

    return (
        <TooltipContext.Provider value={ ContextValue }>
            { children }
        </TooltipContext.Provider>
    );
};

/** {@inheritDoc TooltipTrigger} */
export interface TooltipTriggerProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A pressable anchor that shows its `Tooltip` on hover or long press.
       *
       * @category Component
       * @since 1.0.0
       */
const TooltipTrigger = ({ Style, children }: TooltipTriggerProps): React.JSX.Element =>
{
    const { Show, Hide, AnchorRef } = useTooltipContext();

    return (
        <Pressable
            delayLongPress={ 400 }
            onHoverIn={ Show }
            onHoverOut={ Hide }
            onLongPress={ Show }
            onPressOut={ Hide }
            ref={ AnchorRef }
            style={ Style }>
            { children }
        </Pressable>
    );
};

/** {@inheritDoc TooltipContent} */
export interface TooltipContentProps extends React.PropsWithChildren
{
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A positioned `Tooltip` popup that renders string children with `TooltipDescription`.
       *
       * @category Component
       * @since 1.0.0
       */
const TooltipContent = ({ Placement = "Top", Style, children }: TooltipContentProps): React.JSX.Element =>
{
    const { IsOpen, Hide, AnchorRef: Anchor } = useTooltipContext();

    return (
        <Popup
            { ...{ Anchor, Placement, Style } }
            IsVisible={ IsOpen }
            OnRequestClose={ Hide }
            Variant="Tooltip">
            { typeof children === "string"
                ? <TooltipDescription Text={ children } />
                : children
            }
        </Popup>
    );
};

/**
 * The visual style of a given tooltip's description.
 *
 * @category Display
 * @since 1.0.0
 */
export type TooltipDescriptionType =
    | "Primary"
    | "Secondary"
    | "Image";

/** {@inheritDoc Tooltip} */
export interface TooltipDescriptionProps
{
    readonly Type?: TooltipDescriptionType;
    readonly Text: string;
    /** Applied as `TextStyle` for `"Primary"`/`"Secondary"`, `ImageStyle` for `"Image"`. */
    readonly Style?: StyleProp<TextStyle & ImageStyle>;
}

export/**
       * Renders a tooltip description as primary text, secondary text, or a remote image.
       *
       * @category Component
       * @since 1.0.0
       */
const TooltipDescription = ({
    Style,
    Text: TextValue,
    Type = "Primary"
}: TooltipDescriptionProps): React.JSX.Element =>
{
    if (Type === "Image")
    {
        return (
            <Image
                source={ { uri: TextValue } }
                style={ [
                    {
                        borderRadius: 4,
                        height: 90,
                        width: 140
                    },
                    Style
                ] }
            />
        );
    }

    return (
        <LabelText
            Color={ Type === "Secondary" ? Semantic.TooltipSecondary : Semantic.TooltipPrimary }
            Style={ Style }>
            { TextValue }
        </LabelText>
    );
};

/** {@inheritDoc TooltipPreset} */
export interface TooltipPresetProps extends React.PropsWithChildren
{
    readonly Disabled?: boolean;
    readonly Placement?: PopupPlacement;
    readonly Description: React.ReactNode;
}

export/**
       * `<Tooltip>`+`<TooltipTrigger>`+`<TooltipContent>` collapsed into one call for the common case.
       *
       * @category Component
       * @since 1.0.0
       */
const TooltipPreset = ({
    Disabled,
    Placement = "Top",
    Description,
    children
}: TooltipPresetProps): React.JSX.Element => (
    <Tooltip Disabled={ Disabled }>
        <TooltipTrigger>{ children }</TooltipTrigger>
        <TooltipContent Placement={ Placement }>
            { typeof Description === "string"
                ? <TooltipDescription Text={ Description } />
                : Description
            }
        </TooltipContent>
    </Tooltip>
);
