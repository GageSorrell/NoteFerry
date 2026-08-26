/**
 * Ported from `@notion-kit/ui`'s `primitives/skeleton.tsx`. Source's CSS
 * `animate-pulse` becomes an `Animated.loop` opacity pulse.
 *
 * @module @noteferry/ui/Primitive/Skeleton
 *
 * @file      Skeleton.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import { WithAlpha } from "../Utility/index.js";
import { useToken } from "../ThemeProvider.js";

/** {@inheritDoc Skeleton} */
export interface SkeletonProps
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A placeholder for remote content that is currently being fetched.
       *
       * @category Component
       * @since 1.0.0
       */
const Skeleton = ({ Style }: SkeletonProps): React.JSX.Element =>
{
    const {
        [Semantic.Default]: DefaultColor,
        [Radii.Small]: SmallRadius
    } = useToken(
        Semantic.Default,
        Radii.Small
    );
    const Opacity = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() =>
    {
        const Animation = Animated.loop(
            Animated.sequence([
                Animated.timing(Opacity, {
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    toValue: 0.5,
                    useNativeDriver: true
                }),
                Animated.timing(Opacity, {
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    toValue: 1,
                    useNativeDriver: true
                })
            ])
        );

        Animation.start();

        return Animation.stop;
    }, [ Opacity ]);

    return (
        <Animated.View
            style={ [
                {
                    backgroundColor: WithAlpha(DefaultColor, 0.1),
                    borderRadius: SmallRadius,
                    opacity: Opacity
                },
                Style
            ] }
        />
    );
};
