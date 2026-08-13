/**
 * Ported from `@notion-kit/ui`'s `primitives/meter.tsx`. Source exposes a
 * low-level compound `Meter/MeterTrack/MeterIndicator` plus two composed
 * shapes (`MeterBar`, `MeterRing`) — only the composed shapes are
 * meaningfully reused elsewhere in source, so only those are ported as
 * first-class components here.
 *
 * @module @notivex/ui/Primitive/Meter
 *
 * @file      Meter.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { type StyleProp, View, type ViewStyle } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useToken } from "../ThemeProvider.js";
import { WithAlpha } from "../Utility/index.js";

/** {@inheritDoc MeterBar} */
export interface MeterBarProps extends React.PropsWithChildren
{
    readonly Value: number;
    readonly Max?: number;
    readonly TrackColor?: string;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A horizontal progress indicator that clamps its fill between zero and the configured maximum.
       *
       * @category Component
       * @since 1.0.0
       */
const MeterBar = ({ Value, Max = 100, TrackColor, Style, children }: MeterBarProps): React.JSX.Element =>
{
    const {
        [Semantic.Default]: DefaultColor,
        [Semantic.Blue]: BlueColor
    } = useToken(
        Semantic.Default,
        Semantic.Blue
    );
    const Progress = Max > 0 ? Math.min(Math.max(Value, 0), Max) / Max : 0;

    return (
        <View
            accessibilityRole="progressbar"
            accessibilityValue={ { max: Max, min: 0, now: Value } }
            style={ [ { width: "100%" }, Style ] }>
            { children }
            <View
                style={ {
                    backgroundColor: WithAlpha(DefaultColor, 0.1),
                    borderRadius: 2,
                    height: 4,
                    minHeight: 4,
                    overflow: "hidden",
                    width: "100%"
                } }
            >
                <View
                    style={ {
                        backgroundColor: TrackColor ?? BlueColor,
                        borderRadius: 2,
                        height: "100%",
                        width: `${ Progress * 100 }%`
                    } }
                />
            </View>
        </View>
    );
};

/** {@inheritDoc MeterRing} */
export interface MeterRingProps extends React.PropsWithChildren
{
    readonly Value: number;
    readonly Max?: number;
    readonly TrackColor?: string;
    readonly Size?: number;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A circular progress indicator that clamps its stroke between zero and the configured maximum.
       *
       * @category Component
       * @since 1.0.0
       */
const MeterRing = ({
    Value,
    Max = 100,
    TrackColor,
    Size = 21,
    Style,
    children
}: MeterRingProps): React.JSX.Element =>
{
    const {
        [Semantic.Default]: DefaultColor,
        [Semantic.Blue]: BlueColor
    } = useToken(
        Semantic.Default,
        Semantic.Blue
    );

    const Radius = 6;
    const Circumference = 2 * Math.PI * Radius;
    const Progress = Math.min(Math.max(Value, 0), Max);
    const Offset = Max > 0 ? Circumference * (1 - Progress / Max) : Circumference;

    return (
        <View
            accessibilityRole="progressbar"
            accessibilityValue={ {
                max: Max,
                min: 0,
                now: Value,
                text: `Loading progress: ${ Value }%`
            } }
            style={ Style }>
            { children }
            <Svg
                height={ Size }
                viewBox="0 0 14 14"
                width={ Size }>
                <Circle
                    cx={ 7 }
                    cy={ 7 }
                    fill="none"
                    r={ Radius }
                    stroke={ WithAlpha(DefaultColor, 0.1) }
                    strokeWidth={ 2 }
                />
                <G
                    origin="7, 7"
                    rotation={ -90 }>
                    <Circle
                        cx={ 7 }
                        cy={ 7 }
                        fill="none"
                        r={ Radius }
                        stroke={ TrackColor ?? BlueColor }
                        strokeDasharray={ `${ Circumference }` }
                        strokeDashoffset={ Offset }
                        strokeLinecap="round"
                        strokeWidth={ 2 }
                    />
                </G>
            </Svg>
        </View>
    );
};
