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
import { Animated, Pressable, type StyleProp, type ViewStyle } from "react-native";

import { UseColor } from "../ThemeProvider.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";

export type SwitchSize = "Medium" | "Small";

interface SwitchDimensions {
    readonly Width: number;
    readonly Height: number;
    readonly Thumb: number;
    readonly Travel: number;
}

const DimensionsBySize: Record<SwitchSize, SwitchDimensions> = {
    Medium: { Width: 44, Height: 24, Thumb: 20, Travel: 20 },
    Small: { Width: 28, Height: 16, Thumb: 12, Travel: 12 },
};

export interface SwitchProps {
    readonly Value?: boolean;
    readonly OnValueChange?: (Value: boolean) => void;
    readonly Size?: SwitchSize;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly AccessibilityLabel?: string;
}

export const Switch = ({
    Value = false,
    OnValueChange,
    Size = "Medium",
    Disabled = false,
    Style,
    AccessibilityLabel,
}: SwitchProps): React.JSX.Element =>
{
    const BlueColor = UseColor(Semantic.Blue);
    const DefaultColor = UseColor(Semantic.Default);
    const Dimensions = DimensionsBySize[ Size ];
    const Progress = React.useRef(new Animated.Value(Value ? 1 : 0)).current;

    React.useEffect(() =>
    {
        Animated.timing(Progress, { toValue: Value ? 1 : 0, duration: 150, useNativeDriver: true }).start();
    }, [ Value, Progress ]);

    return (
        <Pressable
            disabled={ Disabled }
            onPress={ () => OnValueChange?.(!Value) }
            accessibilityRole="switch"
            accessibilityLabel={ AccessibilityLabel }
            accessibilityState={ { checked: Value, disabled: Disabled } }
            style={ [
                {
                    width: Dimensions.Width,
                    height: Dimensions.Height,
                    borderRadius: Dimensions.Height / 2,
                    backgroundColor: Value ? BlueColor : WithAlpha(DefaultColor, 0.15),
                    padding: 2,
                    justifyContent: "center",
                    opacity: Disabled ? 0.5 : 1,
                },
                Style,
            ] }
        >
            <Animated.View
                style={ {
                    width: Dimensions.Thumb,
                    height: Dimensions.Thumb,
                    borderRadius: Dimensions.Thumb / 2,
                    backgroundColor: "#FFFFFF",
                    transform: [ {
                        translateX: Progress.interpolate({ inputRange: [ 0, 1 ], outputRange: [ 0, Dimensions.Travel ] }),
                    } ],
                } }
            />
        </Pressable>
    );
};
