/**
 * Loading spinner, ported from `@notion-kit/ui`'s `primitives/spinner.tsx`.
 * The source used a CSS `animate-spin` class on an inline SVG; RN has no
 * CSS animations, so this drives the same rotation via `Animated`.
 *
 * @module @noteferry/ui/Primitive/Spinner
 *
 * @file      Spinner.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useToken } from "../ThemeProvider.js";

/**
 * The visual style of a `Spinner` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type SpinnerVariant =
    | "Solid"
    | "Dashed";

/** {@inheritDoc Spinner} */
export interface SpinnerProps
{
    readonly Variant?: SpinnerVariant;
    readonly Size?: number;
    readonly Color?: string;
    readonly Style?: StyleProp<ViewStyle>;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export/**
       * An animated spinner, to communicate that a task is being performed on behalf of the user.
       *
       * @category Component
       * @since 1.0.0
       */
const Spinner = ({ Variant = "Solid", Size = 16, Color, Style }: SpinnerProps): React.JSX.Element =>
{
    const {
        [Semantic.Border]: BorderColor,
        [Semantic.Icon]: IconColor
    } = useToken(
        Semantic.Border,
        Semantic.Icon
    );
    const ActiveColor = Color ?? IconColor;
    const Rotation = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() =>
    {
        const Animation = Animated.loop(
            Animated.timing(Rotation, {
                duration: Variant === "Dashed" ? 900 : 1100,
                easing: Variant === "Dashed" ? Easing.linear : Easing.inOut(Easing.ease),
                toValue: 1,
                useNativeDriver: true
            })
        );

        Animation.start();

        return Animation.stop;
    }, [ Rotation, Variant ]);

    const RotateStyle = {
        transform: [ {
            rotate: Rotation.interpolate({
                inputRange: [ 0, 1 ],
                outputRange: [ "0deg", "360deg" ]
            })
        } ]
    };

    const Radius = (Size / 2) - 1.5;
    const Circumference = 2 * Math.PI * Radius;

    return (
        <Animated.View
            accessibilityLabel="Loading"
            accessibilityRole="progressbar"
            style={ [ { height: Size, width: Size }, RotateStyle, Style ] }>
            <Svg
                height={ Size }
                viewBox={ `0 0 ${ Size } ${ Size }` }
                width={ Size }>
                <Circle
                    cx={ Size / 2 }
                    cy={ Size / 2 }
                    fill="none"
                    r={ Radius }
                    stroke={ BorderColor }
                    strokeWidth={ 1.5 }
                />
                <AnimatedCircle
                    cx={ Size / 2 }
                    cy={ Size / 2 }
                    fill="none"
                    r={ Radius }
                    stroke={ ActiveColor }
                    strokeDasharray={ `${ Circumference * 0.7 } ${ Circumference }` }
                    strokeLinecap="round"
                    strokeWidth={ 1.5 }
                />
            </Svg>
        </Animated.View>
    );
};
