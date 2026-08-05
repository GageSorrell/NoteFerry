/**
 * Ported from `@notion-kit/ui`'s `primitives/dialog.tsx`. Source built this
 * on `@base-ui/react/dialog`'s portal/backdrop/popup primitives; RN's own
 * `Modal` (`transparent`, `animationType="fade"`) already gives a portal,
 * a full-screen host, and back-button/Escape dismissal for free, so no
 * extra dependency is needed here (unlike the anchored overlays in
 * `Popup.tsx`, a centered dialog has no anchor to measure against).
 *
 * @module @notivex/ui/Primitive/Dialog
 *
 * @file      Dialog.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    View,
    type GestureResponderEvent,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from "react-native";

import { UseColor, useRadii, useSpacing } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { WithAlpha } from "../Utility/index.js";
import { Button, CloseButton, type ButtonProps } from "./Button.js";
import { CloneTrigger } from "./Popup.js";
import { Text } from "./Text.js";

interface DialogContextValue {
    readonly IsOpen: boolean;
    readonly SetIsOpen: (Open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

const useDialogContext = (): DialogContextValue =>
{
    const Value = React.useContext(DialogContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `Dialog` part was used outside of `<Dialog>`.");
    }

    return Value;
};

export interface DialogProps {
    readonly Open?: boolean;
    readonly DefaultOpen?: boolean;
    readonly OnOpenChange?: (Open: boolean) => void;
    readonly children?: React.ReactNode;
}

export const Dialog = ({ Open, DefaultOpen = false, OnOpenChange, children }: DialogProps): React.JSX.Element =>
{
    const [ UncontrolledOpen, SetUncontrolledOpen ] = React.useState(DefaultOpen);
    const IsOpen = Open ?? UncontrolledOpen;

    const SetIsOpen = React.useCallback((NextOpen: boolean) =>
    {
        SetUncontrolledOpen(NextOpen);
        OnOpenChange?.(NextOpen);
    }, [ OnOpenChange ]);

    const ContextValue = React.useMemo<DialogContextValue>(() => ({ IsOpen, SetIsOpen }), [ IsOpen, SetIsOpen ]);

    return <DialogContext.Provider value={ ContextValue }>{ children }</DialogContext.Provider>;
};

export interface DialogTriggerProps {
    /** Clone `children` (e.g. a `Button`) instead of wrapping it in a second `Pressable` — see `CloneTrigger` in `Popup.tsx`. */
    readonly AsChild?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const DialogTrigger = ({ AsChild = false, Style, children }: DialogTriggerProps): React.JSX.Element =>
{
    const { SetIsOpen } = useDialogContext();
    const Open = React.useCallback(() => SetIsOpen(true), [ SetIsOpen ]);

    if (AsChild)
    {
        return CloneTrigger(children as React.ReactElement<{ OnPress?: (Event: GestureResponderEvent) => void }>, Open);
    }

    return <Pressable onPress={ Open } style={ Style }>{ children }</Pressable>;
};

export interface DialogContentProps {
    readonly HideClose?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const DialogContent = ({ HideClose = false, Style, children }: DialogContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen } = useDialogContext();
    const ModalBackground = UseColor(Semantic.BackgroundModal);
    const DefaultColor = UseColor(Semantic.Default);
    const LargeRadius = useRadii(Radii.Large);
    const Gap = useSpacing(Spacing.Small);
    const Padding = useSpacing(Spacing.Large);

    return (
        <Modal visible={ IsOpen } transparent animationType="fade" onRequestClose={ () => SetIsOpen(false) }>
            <Pressable
                style={ [ Styles.Overlay, { backgroundColor: WithAlpha(DefaultColor, 0.5) } ] }
                onPress={ () => SetIsOpen(false) }
                accessibilityRole="none"
            >
                {/* Nested `Pressable`s claim the touch responder exclusively in RN
                    (unlike DOM event bubbling), so a press here does not also fire
                    the overlay's `onPress` above — no `stopPropagation` needed. */}
                <Pressable
                    style={ [
                        Styles.Card,
                        { backgroundColor: ModalBackground, borderRadius: LargeRadius, gap: Gap, padding: Padding },
                        Style,
                    ] }
                >
                    { children }
                    { !HideClose && <View style={ Styles.CloseButton }><CloseButton OnPress={ () => SetIsOpen(false) } /></View> }
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export interface DialogCloseProps {
    readonly Variant?: ButtonProps["Variant"];
    readonly Size?: ButtonProps["Size"];
    readonly Style?: StyleProp<ViewStyle>;
    readonly OnPress?: (Event: GestureResponderEvent) => void;
    readonly children?: React.ReactNode;
}

/** Closes the enclosing `Dialog`. With `children`, renders a labeled `Button`; without, the `X` `CloseButton`. */
export const DialogClose = ({ Variant, Size, Style, OnPress, children }: DialogCloseProps): React.JSX.Element =>
{
    const { SetIsOpen } = useDialogContext();

    const Handle = React.useCallback((Event: GestureResponderEvent) =>
    {
        OnPress?.(Event);
        SetIsOpen(false);
    }, [ OnPress, SetIsOpen ]);

    if (children === undefined)
    {
        return <CloseButton OnPress={ Handle } />;
    }

    return <Button Variant={ Variant ?? "Primary" } Size={ Size ?? "Medium" } Style={ Style } OnPress={ Handle }>{ children }</Button>;
};

export interface DialogHeaderProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const DialogHeader = ({ Style, children }: DialogHeaderProps): React.JSX.Element =>
{
    const Gap = useSpacing(Spacing.ExtraSmall);

    return <View style={ [ { alignItems: "center", gap: Gap }, Style ] }>{ children }</View>;
};

export interface DialogFooterProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const DialogFooter = ({ Style, children }: DialogFooterProps): React.JSX.Element =>
{
    const Gap = useSpacing(Spacing.ExtraSmall);

    return <View style={ [ { alignItems: "center", gap: Gap }, Style ] }>{ children }</View>;
};

export interface DialogIconProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const DialogIcon = ({ Style, children }: DialogIconProps): React.JSX.Element =>
    <View style={ [ Styles.Icon, Style ] }>{ children }</View>;

export interface DialogTitleProps {
    readonly Style?: StyleProp<TextStyle>;
    readonly children?: React.ReactNode;
}

export const DialogTitle = ({ Style, children }: DialogTitleProps): React.JSX.Element =>
    <Text Variant="Heading3" Style={ [ Styles.Centered, Style ] }>{ children }</Text>;

export interface DialogDescriptionProps {
    readonly children?: React.ReactNode;
}

export const DialogDescription = ({ children }: DialogDescriptionProps): React.JSX.Element =>
    <Text Variant="Body" Color={ Semantic.Secondary } Style={ Styles.Centered }>{ children }</Text>;

const Styles = StyleSheet.create({
    Overlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    Card: {
        width: "88%",
        maxWidth: 384,
    },
    CloseButton: {
        position: "absolute",
        top: 16,
        right: 16,
    },
    Icon: {
        alignItems: "center",
        justifyContent: "center",
    },
    Centered: {
        textAlign: "center",
    },
});
