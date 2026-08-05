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

import { Image } from "expo-image";
import * as React from "react";
import { Pressable, type ImageStyle, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import * as Semantic from "../Token/Semantic.js";
import { type PopupAnchor, type PopupPlacement, Popup } from "./Popup.js";
import { Text } from "./Text.js";

interface TooltipContextValue {
    readonly IsOpen: boolean;
    readonly Show: () => void;
    readonly Hide: () => void;
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

export interface TooltipProps {
    readonly Disabled?: boolean | undefined;
    readonly children?: React.ReactNode;
}

export const Tooltip = ({ Disabled = false, children }: TooltipProps): React.JSX.Element =>
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
        () => ({ IsOpen, Show, Hide, AnchorRef }),
        [ IsOpen, Show, Hide ],
    );

    return <TooltipContext.Provider value={ ContextValue }>{ children }</TooltipContext.Provider>;
};

export interface TooltipTriggerProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const TooltipTrigger = ({ Style, children }: TooltipTriggerProps): React.JSX.Element =>
{
    const { Show, Hide, AnchorRef } = useTooltipContext();

    return (
        <Pressable
            ref={ AnchorRef }
            onHoverIn={ Show }
            onHoverOut={ Hide }
            onLongPress={ Show }
            onPressOut={ Hide }
            delayLongPress={ 400 }
            style={ Style }
        >
            { children }
        </Pressable>
    );
};

export interface TooltipContentProps {
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const TooltipContent = ({ Placement = "Top", Style, children }: TooltipContentProps): React.JSX.Element =>
{
    const { IsOpen, Hide, AnchorRef } = useTooltipContext();

    return (
        <Popup IsVisible={ IsOpen } OnRequestClose={ Hide } Anchor={ AnchorRef } Placement={ Placement } Variant="Tooltip" Style={ Style }>
            { typeof children === "string" ? <TooltipDescription Text={ children } /> : children }
        </Popup>
    );
};

export type TooltipDescriptionType = "Primary" | "Secondary" | "Image";

export interface TooltipDescriptionProps {
    readonly Type?: TooltipDescriptionType;
    readonly Text: string;
    /** Applied as `TextStyle` for `"Primary"`/`"Secondary"`, `ImageStyle` for `"Image"`. */
    readonly Style?: StyleProp<TextStyle & ImageStyle>;
}

export const TooltipDescription = ({ Type = "Primary", Text: TextValue, Style }: TooltipDescriptionProps): React.JSX.Element =>
{
    if (Type === "Image")
    {
        return <Image source={ { uri: TextValue } } style={ [ { width: 140, height: 90, borderRadius: 4 }, Style ] } />;
    }

    return (
        <Text
            Variant="Label"
            Color={ Type === "Secondary" ? Semantic.TooltipSecondary : Semantic.TooltipPrimary }
            Style={ Style }
        >
            { TextValue }
        </Text>
    );
};

export interface TooltipPresetProps {
    readonly Disabled?: boolean;
    readonly Placement?: PopupPlacement;
    readonly Description: React.ReactNode;
    readonly children?: React.ReactNode;
}

/** `<Tooltip>`+`<TooltipTrigger>`+`<TooltipContent>` collapsed into one call for the common case. */
export const TooltipPreset = ({ Disabled, Placement = "Top", Description, children }: TooltipPresetProps): React.JSX.Element => (
    <Tooltip Disabled={ Disabled }>
        <TooltipTrigger>{ children }</TooltipTrigger>
        <TooltipContent Placement={ Placement }>
            { typeof Description === "string" ? <TooltipDescription Text={ Description } /> : Description }
        </TooltipContent>
    </Tooltip>
);
