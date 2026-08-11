/**
 * Ported from `@notion-kit/ui`'s `cover/cover.tsx`. Source measures its
 * height in `vh` (`h-[30vh] max-h-70`/`h-[12vh]`), which RN has no direct
 * equivalent for — this resolves the same proportions against
 * `useWindowDimensions` instead. Source nests its own `CoverPicker` trigger
 * directly inside `Cover` (`<CoverPicker {...props}><Button>...</CoverPicker>`);
 * here the "change cover" action is just an `OnChangeCoverPress` callback —
 * every other `BottomSheet`-backed composite in this package (e.g.
 * `DateSheet`) is opened via an externally-owned `Ref`, and `Cover` itself
 * has no sheet to own, so wiring `CoverPicker`'s `Ref`/`OnDismiss` is left to
 * whichever screen renders both.
 *
 * @module @notivex/ui/Primitive/Cover
 *
 * @file      Cover.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Image as ImageIcon, X } from "lucide-react-native";
import { type StyleProp, StyleSheet, View, type ViewStyle, useWindowDimensions } from "react-native";
import { Body } from "../Primitive/Text.js";
import { Image as ExpoImage } from "expo-image";
import { Skeleton } from "../Primitive/Skeleton.js";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { UseToken } from "../ThemeProvider.js";

const MaxHeight = 280 as const;

/** {@inheritDoc Cover} */
export interface CoverProps
{
    readonly Url?: string | undefined;
    readonly AccessibilityLabel?: string;

    /** Renders the image with no "Change cover"/"Remove" overlay. */
    readonly Preview?: boolean;
    readonly OnChangeCoverPress?: () => void;
    readonly OnRemovePress?: () => void;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A page's cover image, with a hover-free (tap-visible) "Change cover"/
       * "Remove" action pair. Renders a shorter, plain strip when `Url` is
       * unset — this component doesn't itself offer an "Add cover" affordance;
       * that trigger lives in whatever page-header composition uses it.
       *
       * @category Component
       * @since 1.0.0
       */
const Cover = ({
    Url,
    AccessibilityLabel = "Cover image",
    Preview = false,
    OnChangeCoverPress,
    OnRemovePress,
    Style
}: CoverProps): React.JSX.Element =>
{
    const { height: WindowHeight } = useWindowDimensions();
    const {
        [Semantic.BackgroundPopover]: PopoverBackground,
        [Semantic.Icon]: IconColor
    } = UseToken(
        Semantic.BackgroundPopover,
        Semantic.Icon
    );

    const CoverHeight = Url === undefined
        ? WindowHeight * 0.12
        : Math.min(WindowHeight * 0.3, MaxHeight);

    return (
        <View style={ [ { height: CoverHeight }, Styles.Root, Style ] }>
            { Url !== undefined && (
                <ExpoImage
                    accessibilityLabel={ AccessibilityLabel }
                    contentFit="cover"
                    source={ { uri: Url } }
                    style={ Styles.Fill }
                />
            ) }
            { Url !== undefined && !Preview && (
                <View style={ Styles.Actions }>
                    { OnChangeCoverPress !== undefined && (
                        <View style={ [ Styles.ActionPill, { backgroundColor: PopoverBackground } ] }>
                            <TouchableOpacity
                                accessibilityLabel="Change cover"
                                accessibilityRole="button"
                                onPress={ OnChangeCoverPress }
                                style={ Styles.ActionButton }>
                                <ImageIcon
                                    color={ IconColor }
                                    size={ 14 }
                                />
                                <Body Style={ Styles.ActionLabel }>Change cover</Body>
                            </TouchableOpacity>
                        </View>
                    ) }
                    { OnRemovePress !== undefined && (
                        <View style={ [ Styles.ActionPill, { backgroundColor: PopoverBackground } ] }>
                            <TouchableOpacity
                                accessibilityLabel="Remove cover"
                                accessibilityRole="button"
                                onPress={ OnRemovePress }
                                style={ Styles.ActionButton }>
                                <X
                                    color={ IconColor }
                                    size={ 14 }
                                />
                                <Body Style={ Styles.ActionLabel }>Remove</Body>
                            </TouchableOpacity>
                        </View>
                    ) }
                </View>
            ) }
        </View>
    );
};

export/**
       * `Cover`'s loading placeholder — source's `Cover.Skeleton`, exported
       * flat here rather than as a static property (this package's other
       * multi-part composites, e.g. `Sortable`, group parts under a frozen
       * namespace object instead of mutating a component function, and a
       * single extra loading-state component doesn't warrant that
       * machinery on its own).
       *
       * @category Component
       * @since 1.0.0
       */
const CoverSkeleton = (): React.JSX.Element =>
{
    const { height: WindowHeight } = useWindowDimensions();

    return <Skeleton Style={ { height: Math.min(WindowHeight * 0.3, MaxHeight), width: "100%" } } />;
};

const Styles = StyleSheet.create({
    ActionButton:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6
    },
    ActionLabel:
    {
        fontSize: 12
    },
    ActionPill:
    {
        borderRadius: 6,
        overflow: "hidden"
    },
    Actions:
    {
        bottom: 12,
        flexDirection: "row",
        gap: 8,
        position: "absolute",
        right: 12
    },
    Fill:
    {
        height: "100%",
        width: "100%"
    },
    Root:
    {
        overflow: "hidden",
        position: "relative",
        width: "100%"
    }
});
