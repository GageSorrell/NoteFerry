/**
 * Windows variant of `Cover.tsx`. Identical except it renders with React
 * Native core's `Image` instead of `expo-image`'s `Image`, and its own
 * "Change cover"/"Remove" buttons use RN core `Pressable` instead of
 * `@gorhom/bottom-sheet`'s `TouchableOpacity`. No image-picker call lives in
 * this file — see `CoverPicker.windows.tsx`.
 *
 * @module @noteferry/ui/Primitive/Cover
 *
 * @file      Cover.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Image as ImageIcon, X } from "../Icon.js";
import { ImageStyle, MakeStyles, ViewStyle as MakeViewStyle, TextStyle } from "../MakeStyles.js";
import { Image, Pressable, type StyleProp, View, type ViewStyle, useWindowDimensions } from "react-native";
import { Body } from "../Primitive/Text.js";
import { Skeleton } from "../Primitive/Skeleton.js";
import type { Thunk } from "@sorrell/effect/Function";
import { useToken } from "../ThemeProvider.js";

const MaxHeight = 280 as const;

/** {@inheritDoc Cover} */
export interface CoverProps
{
    readonly Url?: string | undefined;
    readonly AccessibilityLabel?: string;

    /** Renders the image with no "Change cover"/"Remove" overlay. */
    readonly Preview?: boolean;
    readonly OnChangeCoverPress?: Thunk;
    readonly OnRemovePress?: Thunk;
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
    const Styles = useStyles();
    const { height: WindowHeight } = useWindowDimensions();
    const {
        [Semantic.BackgroundPopover]: PopoverBackground,
        [Semantic.Icon]: IconColor
    } = useToken(
        Semantic.BackgroundPopover,
        Semantic.Icon
    );

    const CoverHeight = Url === undefined
        ? WindowHeight * 0.12
        : Math.min(WindowHeight * 0.3, MaxHeight);

    return (
        <View style={ [ { height: CoverHeight }, Styles.Root, Style ] }>
            { Url !== undefined && (
                <Image
                    accessibilityLabel={ AccessibilityLabel }
                    resizeMode="cover"
                    source={ { uri: Url } }
                    style={ Styles.Fill }
                />
            ) }
            { Url !== undefined && !Preview && (
                <View style={ Styles.Actions }>
                    { OnChangeCoverPress !== undefined && (
                        <View style={ [ Styles.ActionPill, { backgroundColor: PopoverBackground } ] }>
                            <Pressable
                                accessibilityLabel="Change cover"
                                accessibilityRole="button"
                                onPress={ OnChangeCoverPress }
                                style={ Styles.ActionButton }>
                                <ImageIcon
                                    color={ IconColor }
                                    size={ 14 }
                                />
                                <Body Style={ Styles.ActionLabel }>Change cover</Body>
                            </Pressable>
                        </View>
                    ) }
                    { OnRemovePress !== undefined && (
                        <View style={ [ Styles.ActionPill, { backgroundColor: PopoverBackground } ] }>
                            <Pressable
                                accessibilityLabel="Remove cover"
                                accessibilityRole="button"
                                onPress={ OnRemovePress }
                                style={ Styles.ActionButton }>
                                <X
                                    color={ IconColor }
                                    size={ 14 }
                                />
                                <Body Style={ Styles.ActionLabel }>Remove</Body>
                            </Pressable>
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

const useStyles = MakeStyles({
    ActionButton: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6
    }),
    ActionLabel: TextStyle({
        fontSize: 12
    }),
    ActionPill: MakeViewStyle({
        borderRadius: 6,
        overflow: "hidden"
    }),
    Actions: MakeViewStyle({
        bottom: 12,
        flexDirection: "row",
        gap: 8,
        position: "absolute",
        right: 12
    }),
    Fill: ImageStyle({
        height: "100%",
        width: "100%"
    }),
    Root: MakeViewStyle({
        overflow: "hidden",
        position: "relative",
        width: "100%"
    })
});
