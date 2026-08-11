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
 * @module @notivex/ui/Primitive/BottomSheet
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
import {
    type StyleProp,
    StyleSheet,
    type TextStyle,
    type ViewStyle,
    useWindowDimensions
} from "react-native";
import { ThemeProvider, UseTheme, UseToken } from "../ThemeProvider.js";

/** {@inheritDoc BottomSheet} */
export interface BottomSheet extends Gorhom.BottomSheetModal { }

/** {@inheritDoc BottomSheet} */
export interface BottomSheetProps extends React.PropsWithChildren
{
    readonly OnChange?: Gorhom.BottomSheetModalProps["onChange"];
    readonly OnDismiss?: (() => void) | undefined;
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
    OnChange,
    OnDismiss,
    ShowDragIndicator = true,
    Ref,
    TestId,
    children
}: BottomSheetProps): React.JSX.Element =>
{
    const MaxWidth = 480 as const;

    const ColorScheme = UseTheme().Mode;

    const { width: WindowWidth } = useWindowDimensions();

    const marginHorizontal = Math.max(0, (WindowWidth - MaxWidth) / 2);

    const snapPoints = React.useMemo(() => [ "83.333%" ], [ ]);

    return (
        <Gorhom.BottomSheetModal
            backdropComponent={ (Props: Gorhom.BottomSheetBackdropProps) =>
                <Gorhom.BottomSheetBackdrop
                    { ...Props }
                    appearsOnIndex={ 0 }
                    disappearsOnIndex={ -1 }
                    opacity={ 0.667 }
                /> }
            containerStyle={ { marginHorizontal } }
            enableDynamicSizing={ false }
            enablePanDownToClose
            index={ 0 }
            ref={ Ref }
            snapPoints={ snapPoints }
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
    <BottomSheetView>
        <ModalTitle { ...{ Style } }>
            { children }
        </ModalTitle>
    </BottomSheetView>;

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
    const {
        [Spacing.S]: gap,
        [Spacing.SheetHorizontal]: padding
    } = UseToken(
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
    const { [Semantic.BackgroundModal]: backgroundColor } = UseToken(Semantic.BackgroundModal);

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
    const { [Semantic.BackgroundModal]: backgroundColor } = UseToken(Semantic.BackgroundModal);

    return (
        <Gorhom.BottomSheetScrollView
            style={ [ { backgroundColor }, style ] }
            { ...Tail }>
            { children }
        </Gorhom.BottomSheetScrollView>
    );
};

const Styles = StyleSheet.create({
    Footer:
    {
        flexDirection: "column",
        marginTop: "auto"
    }
});
