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
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
export interface DialogProps extends React.PropsWithChildren
{
    readonly Open?: boolean | undefined;
    readonly DefaultOpen?: boolean | undefined;
    readonly OnOpenChange?: ((Open: boolean) => void) | undefined;
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
export interface DialogTriggerProps extends React.PropsWithChildren
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
export interface DialogContentProps extends React.PropsWithChildren
{
    readonly HideClose?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
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
            {/* RN's `Modal` mounts its children in a separate native view tree
                that sits outside the app-root `GestureHandlerRootView`, so the
                gesture-handler-based touchables inside (e.g. `Button`) receive no
                touches. Give the modal its own root so those buttons work. */}
            <GestureHandlerRootView style={ Styles.Root }>
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
            </GestureHandlerRootView>
        </Modal>
    );
};

/** {@inheritDoc DialogClose} */
export interface DialogCloseProps extends React.PropsWithChildren
{
    readonly Variant?: ButtonProps["Appearance"];
    readonly Size?: ButtonProps["Size"];
    readonly Style?: StyleProp<ViewStyle>;
    readonly OnPress?: (Event: GestureResponderEvent) => void;
}

export/**
       * Closes the enclosing `Dialog`. With `children`, renders a
       * labeled `Button`; without, the `X` `CloseButton`.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogClose = ({
    Variant = "Primary",
    Size = "Medium",
    Style,
    OnPress: InOnPress,
    children
}: DialogCloseProps): React.JSX.Element =>
{
    const { SetIsOpen } = useDialogContext();

    const OnPress = React.useCallback((Event: GestureResponderEvent) =>
    {
        InOnPress?.(Event);
        SetIsOpen(false);
    }, [ InOnPress, SetIsOpen ]);

    if (children === undefined)
    {
        return <CloseButton OnPress={ OnPress } />;
    }

    return (
        <Button
            Appearance={ Variant }
            OnPress={ OnPress }
            Size={ Size }
            Style={ Style }>
            { children }
        </Button>
    );
};

/** {@inheritDoc DialogHeader} */
export interface DialogHeaderProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
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
export interface DialogFooterProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
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
export interface DialogIconProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
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
export interface DialogTitleProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<TextStyle>;
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
export interface DialogDescriptionProps extends React.PropsWithChildren { }

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
    },
    Root:
    {
        flex: 1
    }
});
