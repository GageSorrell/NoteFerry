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
 * **`Host` boundary**: `@expo/ui` components must live under a `<Host>`.
 * Per `ThemeProvider`'s doc comment, `Host` must NOT wrap the whole app —
 * on web it renders through a bridging root that does not forward React
 * context, silently detaching descendants from `ThemeProvider`. This
 * component wraps only its own `Host`/`ExpoBottomSheet` subtree, which
 * means `children` (the sheet's content) sits on the far side of that same
 * broken-context boundary. The fix: re-establish a fresh, nested
 * `ThemeProvider` immediately inside `Host`, seeded with the *outer*
 * `Mode` (via `useTheme()`, read here — before the boundary — so it stays
 * in sync with any manual light/dark override) rather than re-deriving
 * `"System"` independently. `ThemeProvider` computes its tokens from
 * `useColorScheme()`/props alone (no ancestor context read), so this needs
 * no context to actually cross the `Host` boundary — it just rebuilds the
 * same state on the other side.
 *
 * @module @notivex/ui/Primitive/BottomSheet
 *
 * @file      BottomSheet.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { Description, Heading3 } from "./Text.js";
import {
    BottomSheet as ExpoBottomSheet,
    type SnapPoint as ExpoSnapPoint,
    Host
} from "@expo/ui";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { ThemeProvider, UseColor, UseTheme, useSpacing } from "../ThemeProvider.js";

/**
 * A height the sheet can rest at. `{Fraction}`/`{Height}` are iOS/web
 * only — on Android, `@expo/ui` snaps them to the nearest of `"Half"`/
 * `"Full"`.
 */
export type BottomSheetSnapPoint =
    | "Half"
    | "Full"
    | { readonly Fraction: number }
    | { readonly Height: number };

const ToExpoSnapPoint = (Point: BottomSheetSnapPoint): ExpoSnapPoint =>
{
    if (Point === "Half")
    {
        return "half";
    }

    if (Point === "Full")
    {
        return "full";
    }

    return "Fraction" in Point ? { fraction: Point.Fraction } : { height: Point.Height };
};

/** {@inheritDoc BottomSheet} */
export interface BottomSheetProps extends React.PropsWithChildren
{
    readonly IsPresented: boolean;
    readonly OnDismiss: () => void;
    /** Heights the sheet can rest at. Omit to auto-size to content. */
    readonly SnapPoints?: ReadonlyArray<BottomSheetSnapPoint>;
    readonly ShowDragIndicator?: boolean;
    readonly TestID?: string;
}

export/**
       * A modal sheet that slides up from the bottom of the screen, built on
       * `@expo/ui`'s native `BottomSheet`. Compose with `BottomSheetHeader`,
       * `BottomSheetTitle`, `BottomSheetDescription`, and `BottomSheetFooter`.
       * @category Component
       * @since 1.0.0
       */
const BottomSheet = ({
    IsPresented,
    OnDismiss,
    SnapPoints,
    ShowDragIndicator = true,
    TestID,
    children
}: BottomSheetProps): React.JSX.Element =>
{
    const { Mode } = UseTheme();
    const BackgroundColor = UseColor(Semantic.BackgroundModal);

    return (
        <Host
            matchContents
            style={ Styles.Host }>
            <ExpoBottomSheet
                isPresented={ IsPresented }
                onDismiss={ OnDismiss }
                showDragIndicator={ ShowDragIndicator }
                { ...(SnapPoints === undefined ? {} : { snapPoints: SnapPoints.map(ToExpoSnapPoint) }) }
                { ...(TestID === undefined ? {} : { testID: TestID }) }>
                <ThemeProvider ColorScheme={ Mode }>
                    <View style={ [ Styles.Content, { backgroundColor: BackgroundColor } ] }>
                        { children }
                    </View>
                </ThemeProvider>
            </ExpoBottomSheet>
        </Host>
    );
};

/** {@inheritDoc BottomSheetHeader} */
export interface BottomSheetHeaderProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetHeader = ({ Style, children }: BottomSheetHeaderProps): React.JSX.Element =>
{
    const Gap = useSpacing(Spacing.ExtraSmall);
    const Padding = useSpacing(Spacing.SheetHorizontal);

    return <View style={ [ { gap: Gap, padding: Padding }, Style ] }>{ children }</View>;
};

/** {@inheritDoc BottomSheetTitle} */
export interface BottomSheetTitleProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetTitle = ({ Style, children }: BottomSheetTitleProps): React.JSX.Element =>
    <Heading3 { ...{ Style } }>
        { children }
    </Heading3>;

/** {@inheritDoc BottomSheetDescription} */
export interface BottomSheetDescriptionProps extends React.PropsWithChildren { }

export/**
       * TODO Write description.
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
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const BottomSheetFooter = ({ Style, children }: BottomSheetFooterProps): React.JSX.Element =>
{
    const Gap = useSpacing(Spacing.Small);
    const Padding = useSpacing(Spacing.SheetHorizontal);

    return (
        <View style={ [ Styles.Footer, { gap: Gap, padding: Padding }, Style ] }>
            { children }
        </View>
    );
};

const Styles = StyleSheet.create({
    Content:
    {
        minHeight: 1
    },
    Footer:
    {
        flexDirection: "column",
        marginTop: "auto"
    },
    /*
     * `ExpoBottomSheet`'s native presentation (a SwiftUI `.sheet()`
     * modifier / Jetpack Compose `ModalBottomSheet` / a fixed-position
     * `View` on web) is anchored to the screen, not to this container's
     * layout box — `position: "absolute"` just keeps the (empty, when
     * dismissed) `Host` mount point out of the surrounding document flow;
     * `matchContents` on `<Host>` governs its actual size.
     */
    Host:
    {
        position: "absolute"
    }
});
