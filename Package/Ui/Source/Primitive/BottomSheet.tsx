/**
 * The unified `Drawer`+`Sheet` primitive (per the port plan's decision to
 * collapse `@notion-kit/ui`'s side-panel `sheet.tsx` and bottom-anchored
 * `drawer.tsx` into one bottom-anchored component — RN has no first-class
 * side-drawer gesture the way web's `vaul`-backed `Drawer` did, and
 * `@expo/ui`'s native `BottomSheet` is bottom-anchored only). Built directly
 * on `@expo/ui`'s universal `BottomSheet`, which renders a true native
 * sheet (SwiftUI on iOS, Jetpack Compose on Android, a CSS-animated `View`
 * on web) instead of an RN `Modal`.
 *
 * @module @noteferry/ui/Primitive/BottomSheet
 *
 * @file      BottomSheet.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Gorhom from "@gorhom/bottom-sheet";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { Description, ModalTitle } from "./Text.js";
import { MakeStyles, ViewStyle as MakeViewStyle } from "../MakeStyles.js";
import {
    type StyleProp,
    type TextStyle,
    View,
    type ViewStyle,
    useWindowDimensions
} from "react-native";
import { ThemeProvider, useTheme, useToken } from "../ThemeProvider.js";

const DefaultSnapPoints = [ "83.333%" ];

/** {@inheritDoc BottomSheet} */
export interface BottomSheet extends Gorhom.BottomSheetModal { }

/** {@inheritDoc BottomSheet} */
export interface BottomSheetProps extends React.PropsWithChildren
{
    /** Overrides the sheet surface and handle-edge background. */
    readonly BackgroundColor?: string | undefined;
    readonly OnChange?: Gorhom.BottomSheetModalProps["onChange"];
    readonly OnDismiss?: (() => void) | undefined;
    /** Sheet heights. The first entry is used when the sheet opens. */
    readonly SnapPoints?: Gorhom.BottomSheetModalProps["snapPoints"];
    readonly ShowDragIndicator?: boolean;
    readonly Ref: React.RefObject<Gorhom.BottomSheetModal | null>;
    readonly TestId?: string;
}

export/**
       * A modal sheet that slides up from the bottom of the screen, built on
       * `@expo/ui`'s native `BottomSheet`. Compose with `BottomSheetHeader`,
       * `BottomSheetTitle`, `BottomSheetDescription`, and `BottomSheetFooter`.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheet = ({
    BackgroundColor,
    OnChange,
    OnDismiss,
    SnapPoints,
    ShowDragIndicator = true,
    Ref,
    TestId,
    children
}: BottomSheetProps): React.JSX.Element =>
{
    const MaxWidth = 480 as const;

    const Styles = useStyles();
    const Theme = useTheme();
    const ColorScheme = Theme.Mode;
    const SheetBackgroundColor = BackgroundColor
        ?? Theme.Semantic.BackgroundModal;
    const HandleColor = ColorScheme === "Dark"
        ? "rgba(255, 255, 255, 0.22)"
        : "rgba(55, 53, 47, 0.16)";

    const { width: WindowWidth } = useWindowDimensions();

    const marginHorizontal = Math.max(0, (WindowWidth - MaxWidth) / 2);

    return (
        <Gorhom.BottomSheetModal
            backdropComponent={ (Props: Gorhom.BottomSheetBackdropProps) =>
                <Gorhom.BottomSheetBackdrop
                    { ...Props }
                    appearsOnIndex={ 0 }
                    disappearsOnIndex={ -1 }
                    opacity={ 0.667 }
                /> }
            backgroundStyle={ [
                Styles.Background,
                { backgroundColor: SheetBackgroundColor }
            ] }
            containerStyle={ { marginHorizontal } }
            enableDynamicSizing={ false }
            enablePanDownToClose
            handleIndicatorStyle={ [
                Styles.HandleIndicator,
                { backgroundColor: HandleColor }
            ] }
            handleStyle={ [
                Styles.Handle,
                { backgroundColor: SheetBackgroundColor }
            ] }
            index={ 0 }
            ref={ Ref }
            snapPoints={ SnapPoints ?? DefaultSnapPoints }
            { ...(OnChange !== undefined ? { onChange: OnChange } : { }) }
            { ...(OnDismiss !== undefined ? { onClose: OnDismiss } : { }) }
            { ...(ShowDragIndicator ? { } : { handleComponent: null }) }
            { ...(TestId === undefined ? { } : { testID: TestId }) }>
            <ThemeProvider { ...{ ColorScheme } }>
                { children }
            </ThemeProvider>
        </Gorhom.BottomSheetModal>
    );
};

/** {@inheritDoc BottomSheetHeader} */
export interface BottomSheetHeaderProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A layout container for heading content at the top of a `BottomSheet`.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetHeader = ({ Style, children }: BottomSheetHeaderProps): React.JSX.Element =>
{
    return (
        <Gorhom.BottomSheetView style={ Style }>
            { children }
        </Gorhom.BottomSheetView>
    );
};

/** {@inheritDoc BottomSheetTitle} */
export interface BottomSheetTitleProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<TextStyle>;
}

export/**
       * The primary heading for a `BottomSheet`.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetTitle = ({ Style, children }: BottomSheetTitleProps): React.JSX.Element =>
    <View>
        <ModalTitle { ...{ Style } }>
            { children }
        </ModalTitle>
    </View>;

/** {@inheritDoc BottomSheetDescription} */
export interface BottomSheetDescriptionProps extends React.PropsWithChildren { }

export/**
       * Supporting text that describes a `BottomSheet`'s purpose or contents.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetDescription = ({ children }: BottomSheetDescriptionProps): React.JSX.Element =>
    <Description Color={ Semantic.Muted }>
        { children }
    </Description>;

/** {@inheritDoc BottomSheetFooter} */
export interface BottomSheetFooterProps extends React.PropsWithChildren
{
    readonly Style?: React.ComponentProps<typeof Gorhom.BottomSheetFooter>["style"];
}

export/**
       * A bottom-sheet footer for actions or other trailing content.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetFooter = ({ Style, children }: BottomSheetFooterProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const {
        [Spacing.S]: gap,
        [Spacing.SheetHorizontal]: padding
    } = useToken(
        Spacing.S,
        Spacing.SheetHorizontal
    );

    const Footer = Gorhom.BottomSheetFooter as any;

    return (
        <Footer style={ { ...Styles.Footer, gap, padding, ...Style } }>
            { children }
        </Footer>
    );
};

/** {@inheritDoc BottomSheetView} */
export interface BottomSheetViewProps extends
    Omit<React.ComponentProps<typeof Gorhom.BottomSheetView>, "children">,
    React.PropsWithChildren { }

/** {@inheritDoc BottomSheetScrollView} */
export interface BottomSheetScrollViewProps extends
    React.ComponentProps<typeof Gorhom.BottomSheetScrollView> { }

export/**
       * A non-scrolling, theme-aware content container for a `BottomSheet`.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetView = ({
    children,
    style,
    ...Tail
}: BottomSheetViewProps): React.JSX.Element =>
{
    const { [Semantic.BackgroundModal]: backgroundColor } = useToken(Semantic.BackgroundModal);

    return (
        <Gorhom.BottomSheetView
            style={ [ { backgroundColor }, style ] }
            { ...Tail }>
            { children }
        </Gorhom.BottomSheetView>
    );
};

export/**
       * A scrollable, theme-aware content container for a `BottomSheet`.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetScrollView = ({
    children,
    style,
    ...Tail
}: BottomSheetScrollViewProps): React.JSX.Element =>
{
    const { [Semantic.BackgroundModal]: backgroundColor } = useToken(Semantic.BackgroundModal);

    return (
        <Gorhom.BottomSheetScrollView
            style={ [ { backgroundColor }, style ] }
            { ...Tail }>
            { children }
        </Gorhom.BottomSheetScrollView>
    );
};

const useStyles = MakeStyles({
    Background: MakeViewStyle({
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14
    }),
    Footer: MakeViewStyle({
        flexDirection: "column",
        marginTop: "auto"
    }),
    Handle: MakeViewStyle({
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        paddingBottom: 8,
        paddingTop: 6
    }),
    HandleIndicator: MakeViewStyle({
        height: 4,
        width: 36
    })
});
