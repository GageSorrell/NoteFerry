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
    type ViewStyle
} from "react-native";
import { Pressable } from "./Pressable.js";
import type { ReadonlyRecord } from "effect/Record";
import { useToken } from "../ThemeProvider.js";
import { WithAlpha } from "../Utility/index.js";

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
}

const DimensionsBySize: ReadonlyRecord<SwitchSize, SwitchDimensions> =
    Object.freeze({
        Medium:
        {
            Height: 34,
            Thumb: 30,
            Travel: 20,
            Width: 54
        },
        Small:
        {
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

const Styles = StyleSheet.create({
    Thumb:
    {
        borderColor: "rgba(15, 15, 15, 0.10)",
        borderWidth: StyleSheet.hairlineWidth,
        elevation: 2,
        shadowColor: "#000000",
        shadowOffset: { height: 1, width: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 1.5
    }
});
