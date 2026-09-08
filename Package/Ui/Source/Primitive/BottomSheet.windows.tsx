/**
 * Windows variant of `BottomSheet.tsx`. A bottom sheet sliding up from the
 * screen edge isn't the native desktop idiom, so this reimplements the same
 * public surface as a centered modal dialog instead: RN core `Modal`
 * (`transparent`, `onRequestClose` wired to dismiss — Escape/Alt-F4 on
 * Windows) wrapping a card `View`, a backdrop `Pressable` behind it calling
 * `OnDismiss`, and a small `Animated.Value`-driven fade/scale-in (JS-driven,
 * no Reanimated). `SnapPoints` is accepted but only used as a max-height cap
 * on the card — there is no multi-snap dragging here.
 *
 * `BottomSheetScrollView`/`BottomSheetView`/`BottomSheetFooter` are
 * re-exported as thin aliases over plain RN `ScrollView`/`View`, so every
 * consumer file's own JSX (which imports these by name from `./BottomSheet.js`)
 * needs no changes: because a relative `./BottomSheet.js` import resolves
 * independently per platform via Metro, this one file swap is automatically
 * picked up by `CoverPicker.windows.tsx`, `IconMenu.windows.tsx`, and
 * `TreeSheet.windows.tsx` with zero extra plumbing.
 *
 * @module @noteferry/ui/Primitive/BottomSheet
 *
 * @file      BottomSheet.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { Description, ModalTitle } from "./Text.js";
import { MakeStyles, ViewStyle as MakeViewStyle } from "../MakeStyles.js";
import {
    Animated,
    Modal,
    Pressable as RNPressable,
    ScrollView,
    type StyleProp,
    type TextStyle,
    View,
    type ViewStyle,
    useWindowDimensions
} from "react-native";
import { Pressable } from "./Pressable.js";
import { ThemeProvider, useTheme, useToken } from "../ThemeProvider.js";

/**
 * The imperative handle a `BottomSheet.windows`'s `Ref` exposes — the
 * `present`/`dismiss` subset of Gorhom's `BottomSheetModal` that every
 * consumer in this package (and, empirically, every mobile call site) ever
 * calls.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export interface BottomSheetHandle
{
    readonly present: () => void;
    readonly dismiss: () => void;
}

/** {@inheritDoc BottomSheet} */
export interface BottomSheetProps extends React.PropsWithChildren
{
    /** Overrides the sheet surface and handle-edge background. */
    readonly BackgroundColor?: string | undefined;
    readonly OnChange?: ((Index: number) => void) | undefined;
    readonly OnDismiss?: (() => void) | undefined;
    /** Used only as a max-height cap on the card — see the file header comment. */
    readonly SnapPoints?: ReadonlyArray<string | number> | undefined;
    readonly ShowDragIndicator?: boolean;
    readonly Ref: React.RefObject<BottomSheetHandle | null>;
    readonly TestId?: string;
}

const ResolveMaxHeight = (
    SnapPoints: BottomSheetProps["SnapPoints"],
    WindowHeight: number
): number | undefined =>
{
    const First = SnapPoints?.[ 0 ];

    if (First === undefined)
    {
        return undefined;
    }

    if (typeof First === "number")
    {
        return First;
    }

    const Match = /^(\d+(?:\.\d+)?)%$/.exec(First);

    return Match === null ? undefined : WindowHeight * (Number.parseFloat(Match[ 1 ]!) / 100);
};

const AnimationDurationMs = 180;

export/**
       * A centered modal dialog — the Windows analogue of the mobile
       * bottom-anchored sheet. See the file header comment for why.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheet = ({
    BackgroundColor,
    OnChange,
    OnDismiss,
    SnapPoints,
    Ref,
    TestId,
    children
}: BottomSheetProps): React.JSX.Element =>
{
    const MaxWidth = 480 as const;

    const Styles = useStyles();
    const Theme = useTheme();
    const ColorScheme = Theme.Mode;
    const SheetBackgroundColor = BackgroundColor ?? Theme.Semantic.BackgroundModal;
    const { width: WindowWidth, height: WindowHeight } = useWindowDimensions();
    const MaxHeight = ResolveMaxHeight(SnapPoints, WindowHeight);

    const [ IsMounted, SetIsMounted ] = React.useState(false);
    const Progress = React.useRef(new Animated.Value(0)).current;

    const AnimateTo = React.useCallback((ToValue: number, OnComplete?: () => void) =>
    {
        Animated.timing(Progress, {
            duration: AnimationDurationMs,
            toValue: ToValue,
            useNativeDriver: true
        }).start(() => OnComplete?.());
    }, [ Progress ]);

    const Dismiss = React.useCallback(() =>
    {
        AnimateTo(0, () =>
        {
            SetIsMounted(false);
            OnChange?.(-1);
            OnDismiss?.();
        });
    }, [ AnimateTo, OnChange, OnDismiss ]);

    React.useImperativeHandle(Ref, () => ({
        dismiss: Dismiss,
        present: () =>
        {
            SetIsMounted(true);
            OnChange?.(0);
        }
    }), [ Dismiss, OnChange ]);

    /* Kick off the enter animation only once the `Modal` (and its content) is
     * actually mounted, so the fade/scale has something to animate onto. */
    React.useEffect(() =>
    {
        if (IsMounted)
        {
            Progress.setValue(0);
            AnimateTo(1);
        }
    }, [ IsMounted, AnimateTo, Progress ]);

    return (
        <Modal
            animationType="none"
            onRequestClose={ Dismiss }
            transparent
            visible={ IsMounted }
            { ...(TestId === undefined ? { } : { testID: TestId }) }>
            <Pressable
                Accessibility={ {
                    Label: undefined,
                    Role: "none"
                } }
                OnPress={ Dismiss }
                style={ Styles.Overlay }>
                {/* An inert (no `onPress`) nested `Pressable` still claims the touch
                    responder, so tapping the card doesn't also dismiss via the
                    overlay's `onPress` above — no `stopPropagation` needed. */}
                <RNPressable style={ { marginHorizontal: Math.max(0, (WindowWidth - MaxWidth) / 2) } }>
                    <Animated.View
                        style={ [
                            Styles.Card,
                            {
                                backgroundColor: SheetBackgroundColor,
                                maxHeight: MaxHeight,
                                maxWidth: MaxWidth,
                                opacity: Progress,
                                transform: [ {
                                    scale: Progress.interpolate({
                                        inputRange: [ 0, 1 ],
                                        outputRange: [ 0.96, 1 ]
                                    })
                                } ]
                            }
                        ] }>
                        <ThemeProvider { ...{ ColorScheme } }>
                            { children }
                        </ThemeProvider>
                    </Animated.View>
                </RNPressable>
            </Pressable>
        </Modal>
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
    <View style={ Style }>
        { children }
    </View>;

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
    readonly Style?: StyleProp<ViewStyle>;
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
        [Spacing.S]: Gap,
        [Spacing.SheetHorizontal]: Padding
    } = useToken(
        Spacing.S,
        Spacing.SheetHorizontal
    );

    return (
        <View style={ [ Styles.Footer, { gap: Gap, padding: Padding }, Style ] }>
            { children }
        </View>
    );
};

/** {@inheritDoc BottomSheetView} */
export interface BottomSheetViewProps extends React.PropsWithChildren
{
    readonly style?: StyleProp<ViewStyle>;
}

/** {@inheritDoc BottomSheetScrollView} */
export interface BottomSheetScrollViewProps extends React.ComponentProps<typeof ScrollView> { }

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
        <View
            style={ [ { backgroundColor }, style ] }
            { ...Tail }>
            { children }
        </View>
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
        <ScrollView
            style={ [ { backgroundColor }, style ] }
            { ...Tail }>
            { children }
        </ScrollView>
    );
};

const useStyles = MakeStyles({
    Card: MakeViewStyle({
        borderRadius: 14,
        overflow: "hidden",
        width: "88%"
    }),
    Footer: MakeViewStyle({
        flexDirection: "column"
    }),
    Overlay: MakeViewStyle({
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        flex: 1,
        justifyContent: "center"
    })
});
