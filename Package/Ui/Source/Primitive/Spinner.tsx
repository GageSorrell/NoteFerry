/**
 * Loading spinner, ported from `@notion-kit/ui`'s `primitives/spinner.tsx`.
 * The source used a CSS `animate-spin` class on an inline SVG; RN has no
 * CSS animations, so this drives the same rotation via `Animated`.
 *
 * @module @notivex/ui/Primitive/Spinner
 *
 * @file      Spinner.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { UseColor } from "../ThemeProvider.js";
import * as Semantic from "../Token/Semantic.js";

export type SpinnerVariant = "Solid" | "Dashed";

export interface SpinnerProps {
    readonly Variant?: SpinnerVariant;
    readonly Size?: number;
    readonly Color?: string;
    readonly Style?: StyleProp<ViewStyle>;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const Spinner = ({ Variant = "Solid", Size = 16, Color, Style }: SpinnerProps): React.JSX.Element =>
{
    const BorderColor = UseColor(Semantic.Border);
    const IconColor = UseColor(Semantic.Icon);
    const ActiveColor = Color ?? IconColor;
    const Rotation = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() =>
    {
        const Animation = Animated.loop(
            Animated.timing(Rotation, {
                toValue: 1,
                duration: Variant === "Dashed" ? 900 : 1100,
                easing: Variant === "Dashed" ? Easing.linear : Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        );

        Animation.start();

        return () => Animation.stop();
    }, [ Rotation, Variant ]);

    const RotateStyle = {
        transform: [ {
            rotate: Rotation.interpolate({ inputRange: [ 0, 1 ], outputRange: [ "0deg", "360deg" ] }),
        } ],
    };

    const Radius = (Size / 2) - 1.5;
    const Circumference = 2 * Math.PI * Radius;

    return (
        <Animated.View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading"
            style={ [ { width: Size, height: Size }, RotateStyle, Style ] }
        >
            <Svg width={ Size } height={ Size } viewBox={ `0 0 ${ Size } ${ Size }` }>
                <Circle
                    cx={ Size / 2 }
                    cy={ Size / 2 }
                    r={ Radius }
                    fill="none"
                    stroke={ BorderColor }
                    strokeWidth={ 1.5 }
                />
                <AnimatedCircle
                    cx={ Size / 2 }
                    cy={ Size / 2 }
                    r={ Radius }
                    fill="none"
                    stroke={ ActiveColor }
                    strokeWidth={ 1.5 }
                    strokeLinecap="round"
                    strokeDasharray={ `${ Circumference * 0.7 } ${ Circumference }` }
                />
            </Svg>
        </Animated.View>
    );
};
