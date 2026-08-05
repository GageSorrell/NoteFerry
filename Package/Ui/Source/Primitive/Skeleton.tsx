/**
 * Ported from `@notion-kit/ui`'s `primitives/skeleton.tsx`. Source's CSS
 * `animate-pulse` becomes an `Animated.loop` opacity pulse.
 *
 * @module @notivex/ui/Primitive/Skeleton
 *
 * @file      Skeleton.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

import { UseColor, useRadii } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";

export interface SkeletonProps {
    readonly Style?: StyleProp<ViewStyle>;
}

export const Skeleton = ({ Style }: SkeletonProps): React.JSX.Element =>
{
    const DefaultColor = UseColor(Semantic.Default);
    const SmallRadius = useRadii(Radii.Small);
    const Opacity = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() =>
    {
        const Animation = Animated.loop(
            Animated.sequence([
                Animated.timing(Opacity, { toValue: 0.5, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(Opacity, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
        );

        Animation.start();

        return () => Animation.stop();
    }, [ Opacity ]);

    return (
        <Animated.View
            style={ [
                { opacity: Opacity, borderRadius: SmallRadius, backgroundColor: WithAlpha(DefaultColor, 0.1) },
                Style,
            ] }
        />
    );
};
