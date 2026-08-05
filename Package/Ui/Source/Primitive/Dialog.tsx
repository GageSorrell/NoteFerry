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

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { Body, Heading3 } from "./Text.js";
import { Button, type ButtonProps, CloseButton } from "./Button.js";
import {
    type GestureResponderEvent,
    Modal,
    Pressable,
    type StyleProp,
    StyleSheet,
    type TextStyle,
    View,
    type ViewStyle
} from "react-native";
import { UseColor, useRadii, useSpacing } from "../ThemeProvider.js";
import { CloneTrigger } from "./Popup.js";
import { WithAlpha } from "../Utility/index.js";

interface DialogContextValue
{
    readonly IsOpen: boolean;
    readonly SetIsOpen: (Open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

export/**
       * Exposed so other overlay-hosting primitives (e.g. `Command.tsx`'s
       * `CommandDialog`) can reuse this engine.
       *
       * @throws {Error} When a dialog part is used outside of `<Dialog>`.
       *
       * @category Hook
       * @since 1.0.0
       */
const useDialogContext = (): DialogContextValue =>
{
    const Value = React.useContext(DialogContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `Dialog` part was used outside of `<Dialog>`.");
    }

    return Value;
};

/** {@inheritDoc Dialog} */
export interface DialogProps
{
    readonly Open?: boolean | undefined;
    readonly DefaultOpen?: boolean | undefined;
    readonly OnOpenChange?: ((Open: boolean) => void) | undefined;
    readonly children?: React.ReactNode;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const Dialog = ({ Open, DefaultOpen = false, OnOpenChange, children }: DialogProps): React.JSX.Element =>
{
    const [ UncontrolledOpen, SetUncontrolledOpen ] = React.useState(DefaultOpen);
    const IsOpen = Open ?? UncontrolledOpen;

    const SetIsOpen = React.useCallback((NextOpen: boolean) =>
    {
        SetUncontrolledOpen(NextOpen);
        OnOpenChange?.(NextOpen);
    }, [ OnOpenChange ]);

    const ContextValue = React.useMemo<DialogContextValue>(
        () => ({ IsOpen, SetIsOpen }),
        [ IsOpen, SetIsOpen ]
    );

    return (
        <DialogContext.Provider value={ ContextValue }>
            { children }
        </DialogContext.Provider>
    );
};

/** {@inheritDoc DialogTrigger} */
export interface DialogTriggerProps
{
    /**
     * Clone `children` (e.g. a `Button`) instead of wrapping it in a second `Pressable`
     *
     * @see {@link CloneTrigger}
     */
    readonly AsChild?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogTrigger = ({ AsChild = false, Style, children }: DialogTriggerProps): React.JSX.Element =>
{
    const { SetIsOpen } = useDialogContext();
    const Open = React.useCallback(() => SetIsOpen(true), [ SetIsOpen ]);

    if (AsChild)
    {
        return CloneTrigger(
            children as React.ReactElement<{ OnPress?: (Event: GestureResponderEvent) => void }>,
            Open
        );
    }

    return (
        <Pressable
            onPress={ Open }
            style={ Style }>
            { children }
        </Pressable>
    );
};

/** {@inheritDoc DialogContent} */
export interface DialogContentProps
{
    readonly HideClose?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogContent = ({ HideClose = false, Style, children }: DialogContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen } = useDialogContext();
    const ModalBackground = UseColor(Semantic.BackgroundModal);
    const DefaultColor = UseColor(Semantic.Default);
    const LargeRadius = useRadii(Radii.Large);
    const Gap = useSpacing(Spacing.Small);
    const Padding = useSpacing(Spacing.Large);

    return (
        <Modal
            animationType="fade"
            onRequestClose={ () => SetIsOpen(false) }
            transparent
            visible={ IsOpen }>
            <Pressable
                accessibilityRole="none"
                onPress={ () => SetIsOpen(false) }
                style={ [ Styles.Overlay, { backgroundColor: WithAlpha(DefaultColor, 0.5) } ] }>
                {/* Nested `Pressable`s claim the touch responder exclusively in RN
                    (unlike DOM event bubbling), so a press here does not also fire
                    the overlay's `onPress` above — no `stopPropagation` needed. */}
                <Pressable
                    style={ [
                        Styles.Card,
                        {
                            backgroundColor: ModalBackground,
                            borderRadius: LargeRadius,
                            gap: Gap,
                            padding: Padding
                        },
                        Style
                    ] }>
                    { children }
                    { !HideClose && (
                        <View style={ Styles.CloseButton }>
                            <CloseButton OnPress={ () => SetIsOpen(false) } />
                        </View>
                    ) }
                </Pressable>
            </Pressable>
        </Modal>
    );
};

/** {@inheritDoc DialogClose} */
export interface DialogCloseProps
{
    readonly Variant?: ButtonProps["Variant"];
    readonly Size?: ButtonProps["Size"];
    readonly Style?: StyleProp<ViewStyle>;
    readonly OnPress?: (Event: GestureResponderEvent) => void;
    readonly children?: React.ReactNode;
}

export/**
       * Closes the enclosing `Dialog`. With `children`, renders a
       * labeled `Button`; without, the `X` `CloseButton`.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogClose = ({ Variant, Size, Style, OnPress, children }: DialogCloseProps): React.JSX.Element =>
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

    return (
        <Button
            OnPress={ Handle }
            Size={ Size ?? "Medium" }
            Style={ Style }
            Variant={ Variant ?? "Primary" }>
            { children }
        </Button>
    );
};

/** {@inheritDoc DialogHeader} */
export interface DialogHeaderProps
{
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogHeader = ({ Style, children }: DialogHeaderProps): React.JSX.Element =>
{
    const Gap = useSpacing(Spacing.ExtraSmall);

    return <View style={ [ { alignItems: "center", gap: Gap }, Style ] }>{ children }</View>;
};

/** {@inheritDoc DialogFooter} */
export interface DialogFooterProps
{
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogFooter = ({ Style, children }: DialogFooterProps): React.JSX.Element =>
{
    const Gap = useSpacing(Spacing.ExtraSmall);

    return <View style={ [ { alignItems: "center", gap: Gap }, Style ] }>{ children }</View>;
};

/** {@inheritDoc DialogIcon} */
export interface DialogIconProps
{
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogIcon = ({ Style, children }: DialogIconProps): React.JSX.Element =>
    <View style={ [ Styles.Icon, Style ] }>{ children }</View>;

/** {@inheritDoc DialogTitle} */
export interface DialogTitleProps
{
    readonly Style?: StyleProp<TextStyle>;
    readonly children?: React.ReactNode;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogTitle = ({ Style, children }: DialogTitleProps): React.JSX.Element =>
    <Heading3 Style={ [ Styles.Centered, Style ] }>
        { children }
    </Heading3>;

/** {@inheritDoc DialogDescription} */
export interface DialogDescriptionProps
{
    readonly children?: React.ReactNode;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogDescription = ({ children }: DialogDescriptionProps): React.JSX.Element =>
    <Body
        Color={ Semantic.Secondary }
        Style={ Styles.Centered }>
        { children }
    </Body>;

const Styles = StyleSheet.create({
    Card:
    {
        maxWidth: 384,
        width: "88%"
    },
    Centered:
    {
        textAlign: "center"
    },
    CloseButton:
    {
        position: "absolute",
        right: 16,
        top: 16
    },
    Icon:
    {
        alignItems: "center",
        justifyContent: "center"
    },
    Overlay:
    {
        alignItems: "center",
        flex: 1,
        justifyContent: "center"
    }
});
