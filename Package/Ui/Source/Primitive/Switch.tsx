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
import { Animated, Pressable, type StyleProp, type ViewStyle } from "react-native";
import type { ReadonlyRecord } from "effect/Record";
import { UseToken } from "../ThemeProvider.js";
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
            Height: 24,
            Thumb: 20,
            Travel: 20,
            Width: 44
        },
        Small:
        {
            Height: 16,
            Thumb: 12,
            Travel: 12,
            Width: 28
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
    } = UseToken(
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
            accessibilityLabel={ AccessibilityLabel }
            accessibilityRole="switch"
            accessibilityState={ { checked: Value, disabled: Disabled } }
            disabled={ Disabled }
            onPress={ () => OnValueChange?.(!Value) }
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
                style={ {
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
                } }
            />
        </Pressable>
    );
};
