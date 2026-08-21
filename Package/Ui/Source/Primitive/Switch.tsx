/**
 * Ported from `@notion-kit/ui`'s `primitives/switch.tsx`. The thumb's CSS
 * `translate-x-full` transition becomes an `Animated.Value`-driven
 * `translateX`.
 *
 * @module @notivex/ui/Primitive/Switch
 *
 * @file      Switch.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    Animated,
    type StyleProp,
    StyleSheet,
    View as RNView,
    type ViewStyle
} from "react-native";
import { MakeStyles, ViewStyle as MakeViewStyle } from "../MakeStyles.js";
import { Body } from "./Text.js";
import { Pressable } from "./Pressable.js";
import type { ReadonlyRecord } from "effect/Record";
import { WithAlpha } from "../Utility/index.js";
import { useTheme, useToken } from "../ThemeProvider.js";

/**
 * The size of a `Switch` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type SwitchSize =
    | "Medium"
    | "Small";

interface SwitchDimensions
{
    readonly Width: number;
    readonly Height: number;
    readonly Thumb: number;
    readonly Travel: number;

    /** Font size of the high-contrast "0"/"1" state label at this size. */
    readonly ContrastFontSize: number;
}

const DimensionsBySize: ReadonlyRecord<SwitchSize, SwitchDimensions> =
    Object.freeze({
        Medium:
        {
            ContrastFontSize: 10,
            Height: 34,
            Thumb: 30,
            Travel: 20,
            Width: 54
        },
        Small:
        {
            ContrastFontSize: 8,
            Height: 22,
            Thumb: 18,
            Travel: 14,
            Width: 36
        }
    } as const);

/** {@inheritDoc Switch} */
export interface SwitchProps
{
    readonly Value?: boolean;
    readonly OnValueChange?: (Value: boolean) => void;
    readonly Size?: SwitchSize;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly AccessibilityLabel?: string;
}

export/**
       * A binary switch.
       *
       * @category Component
       * @since 1.0.0
       */
const Switch = ({
    AccessibilityLabel,
    Disabled = false,
    OnValueChange,
    Size = "Medium",
    Style,
    Value = false
}: SwitchProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const { HighContrast } = useTheme();
    const {
        [Semantic.Blue]: BlueColor,
        [Semantic.Default]: DefaultColor
    } = useToken(
        Semantic.Blue,
        Semantic.Default
    );
    const Dimensions = DimensionsBySize[ Size ];
    const Progress = React.useRef(new Animated.Value(Value ? 1 : 0)).current;

    React.useEffect(() =>
    {
        Animated.timing(Progress, {
            duration: 150,
            toValue: Value ? 1 : 0,
            useNativeDriver: true
        }).start();
    }, [ Value, Progress ]);

    return (
        <Pressable
            Accessibility={ {
                Label: AccessibilityLabel,
                Role: "switch",
                State: { checked: Value, disabled: Disabled }
            } }
            Disabled={ Disabled }
            OnPress={ () => OnValueChange?.(!Value) }
            style={ [
                {
                    backgroundColor: Value ? BlueColor : WithAlpha(DefaultColor, 0.15),
                    borderRadius: Dimensions.Height / 2,
                    height: Dimensions.Height,
                    justifyContent: "center",
                    opacity: Disabled ? 0.5 : 1,
                    padding: 2,
                    width: Dimensions.Width
                },
                Style
            ] }
        >
            { /* Notion's high-contrast accessibility mode labels a switch's
                 state with a digit — "1" when on, "0" when off — sitting in
                 the track space the thumb has vacated, so the state reads
                 without relying on the track color alone. */ }
            { HighContrast
                ? (
                    <RNView
                        pointerEvents="none"
                        style={ [
                            Styles.ContrastLabel,
                            { left: Value ? 0 : Dimensions.Thumb, width: Dimensions.Travel }
                        ] }>
                        <Body
                            Color={ Value ? "#FFFFFF" : DefaultColor }
                            Style={ {
                                fontSize: Dimensions.ContrastFontSize,
                                lineHeight: Dimensions.ContrastFontSize + 2
                            } }
                            Weight="700">
                            { Value ? "1" : "0" }
                        </Body>
                    </RNView>
                )
                : null }
            <Animated.View
                style={ [
                    Styles.Thumb,
                    {
                        backgroundColor: "#FFFFFF",
                        borderRadius: Dimensions.Thumb / 2,
                        height: Dimensions.Thumb,
                        transform: [ {
                            translateX: Progress.interpolate({
                                inputRange: [ 0, 1 ],
                                outputRange: [ 0, Dimensions.Travel ]
                            })
                        } ],
                        width: Dimensions.Thumb
                    }
                ] }
            />
        </Pressable>
    );
};

const useStyles = MakeStyles({
    ContrastLabel: MakeViewStyle({
        alignItems: "center",
        bottom: 0,
        justifyContent: "center",
        position: "absolute",
        top: 0
    }),
    Thumb: MakeViewStyle({
        borderColor: "rgba(15, 15, 15, 0.10)",
        borderWidth: StyleSheet.hairlineWidth,
        elevation: 2,
        shadowColor: "#000000",
        shadowOffset: { height: 1, width: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 1.5
    })
});
