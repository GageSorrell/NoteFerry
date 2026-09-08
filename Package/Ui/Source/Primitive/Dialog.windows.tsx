/**
 * Windows variant of `Dialog.tsx`. Identical except the mobile file's
 * `GestureHandlerRootView` wrapper (needed there because RN's `Modal` mounts
 * outside the app-root gesture-handler root, and `Button`/friends are built
 * on gesture-handler touchables) is dropped entirely: no `.windows.tsx` file
 * in this package uses `react-native-gesture-handler` or
 * `@gorhom/bottom-sheet` touchables, so a plain `View` is enough.
 *
 * @module @noteferry/ui/Primitive/Dialog
 *
 * @file      Dialog.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { Button, type ButtonProps, CloseButton } from "./Button.js";
import { Description, ModalTitle } from "./Text.js";
import {
    type GestureResponderEvent,
    Modal,
    Pressable as RNPressable,
    type StyleProp,
    type TextStyle,
    View,
    type ViewStyle
} from "react-native";
import { MakeStyles, TextStyle as MakeTextStyle, ViewStyle as MakeViewStyle } from "../MakeStyles.js";
import { CloneTrigger } from "./Popup.js";
import { Pressable } from "./Pressable.js";
import { WithAlpha } from "../Utility/index.js";
import { useToken } from "../ThemeProvider.js";

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
        throw new Error("[@noteferry/ui] A `Dialog` part was used outside of `<Dialog>`.");
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
       * A state provider that coordinates the open state of a compound modal dialog.
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
       * A pressable control that opens its surrounding `Dialog`.
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
        <RNPressable
            onPress={ Open }
            style={ Style }>
            { children }
        </RNPressable>
    );
};

/** {@inheritDoc DialogContent} */
export interface DialogContentProps extends React.PropsWithChildren
{
    readonly HideClose?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * The modal overlay and card that display a `Dialog`'s contents.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogContent = ({ HideClose = false, Style, children }: DialogContentProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const { IsOpen, SetIsOpen } = useDialogContext();
    const {
        [Semantic.BackgroundModal]: ModalBackground,
        [Semantic.Default]: DefaultColor,
        [Radii.Large]: LargeRadius,
        [Spacing.S]: Gap,
        [Spacing.L]: Padding
    } = useToken(
        Semantic.BackgroundModal,
        Semantic.Default,
        Radii.Large,
        Spacing.S,
        Spacing.L
    );

    return (
        <Modal
            animationType="fade"
            onRequestClose={ () => SetIsOpen(false) }
            transparent
            visible={ IsOpen }>
            <View style={ Styles.Root }>
                <Pressable
                    Accessibility={ {
                        Label: undefined,
                        Role: "none"
                    } }
                    OnPress={ () => SetIsOpen(false) }
                    style={ [ Styles.Overlay, { backgroundColor: WithAlpha(DefaultColor, 0.5) } ] }>
                    {/* Nested `Pressable`s claim the touch responder exclusively in RN
                        (unlike DOM event bubbling), so a press here does not also fire
                        the overlay's `onPress` above — no `stopPropagation` needed. */}
                    <RNPressable
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
                    </RNPressable>
                </Pressable>
            </View>
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
       * A centered layout container for a `Dialog`'s heading content.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogHeader = ({ Style, children }: DialogHeaderProps): React.JSX.Element =>
{
    const { [Spacing.Xs]: Gap } = useToken(Spacing.Xs);

    return <View style={ [ { alignItems: "center", gap: Gap }, Style ] }>{ children }</View>;
};

/** {@inheritDoc DialogFooter} */
export interface DialogFooterProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A centered layout container for a `Dialog`'s actions or trailing content.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogFooter = ({ Style, children }: DialogFooterProps): React.JSX.Element =>
{
    const { [Spacing.Xs]: Gap } = useToken(Spacing.Xs);

    return <View style={ [ { alignItems: "center", gap: Gap }, Style ] }>{ children }</View>;
};

/** {@inheritDoc DialogIcon} */
export interface DialogIconProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A centered container for the illustrative icon in a `Dialog`.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogIcon = ({ Style, children }: DialogIconProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return <View style={ [ Styles.Icon, Style ] }>{ children }</View>;
};

/** {@inheritDoc DialogTitle} */
export interface DialogTitleProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<TextStyle>;
}

export/**
       * The primary, centered heading for a `Dialog`.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogTitle = ({ Style, children }: DialogTitleProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <ModalTitle Style={ [ Styles.Centered, Style ] }>
            { children }
        </ModalTitle>
    );
};

/** {@inheritDoc DialogDescription} */
export interface DialogDescriptionProps extends React.PropsWithChildren { }

export/**
       * Supporting text that describes a `Dialog`'s purpose or requested action.
       *
       * @category Component
       * @since 1.0.0
       */
const DialogDescription = ({ children }: DialogDescriptionProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <Description Style={ Styles.Centered }>
            { children }
        </Description>
    );
};

const useStyles = MakeStyles({
    Card: MakeViewStyle({
        maxWidth: 384,
        width: "88%"
    }),
    Centered: MakeTextStyle({
        textAlign: "center"
    }),
    CloseButton: MakeViewStyle({
        position: "absolute",
        right: 16,
        top: 16
    }),
    Icon: MakeViewStyle({
        alignItems: "center",
        justifyContent: "center"
    }),
    Overlay: MakeViewStyle({
        alignItems: "center",
        flex: 1,
        justifyContent: "center"
    }),
    Root: MakeViewStyle({
        flex: 1
    })
});
