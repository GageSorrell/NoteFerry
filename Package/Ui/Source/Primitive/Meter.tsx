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
import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { UseColor } from "../ThemeProvider.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";

export interface MeterBarProps {
    readonly Value: number;
    readonly Max?: number;
    readonly TrackColor?: string;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const MeterBar = ({ Value, Max = 100, TrackColor, Style, children }: MeterBarProps): React.JSX.Element =>
{
    const DefaultColor = UseColor(Semantic.Default);
    const BlueColor = UseColor(Semantic.Blue);
    const Progress = Max > 0 ? Math.min(Math.max(Value, 0), Max) / Max : 0;

    return (
        <View
            accessibilityRole="progressbar"
            accessibilityValue={ { min: 0, max: Max, now: Value } }
            style={ [ { width: "100%" }, Style ] }
        >
            { children }
            <View
                style={ {
                    height: 4,
                    minHeight: 4,
                    width: "100%",
                    borderRadius: 2,
                    overflow: "hidden",
                    backgroundColor: WithAlpha(DefaultColor, 0.1),
                } }
            >
                <View
                    style={ {
                        height: "100%",
                        width: `${ Progress * 100 }%`,
                        borderRadius: 2,
                        backgroundColor: TrackColor ?? BlueColor,
                    } }
                />
            </View>
        </View>
    );
};

export interface MeterRingProps {
    readonly Value: number;
    readonly Max?: number;
    readonly TrackColor?: string;
    readonly Size?: number;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const MeterRing = ({ Value, Max = 100, TrackColor, Size = 21, Style, children }: MeterRingProps): React.JSX.Element =>
{
    const DefaultColor = UseColor(Semantic.Default);
    const BlueColor = UseColor(Semantic.Blue);

    const Radius = 6;
    const Circumference = 2 * Math.PI * Radius;
    const Progress = Math.min(Math.max(Value, 0), Max);
    const Offset = Max > 0 ? Circumference * (1 - Progress / Max) : Circumference;

    return (
        <View
            accessibilityRole="progressbar"
            accessibilityValue={ { min: 0, max: Max, now: Value, text: `Loading progress: ${ Value }%` } }
            style={ Style }
        >
            { children }
            <Svg width={ Size } height={ Size } viewBox="0 0 14 14">
                <Circle cx={ 7 } cy={ 7 } r={ Radius } fill="none" strokeWidth={ 2 } stroke={ WithAlpha(DefaultColor, 0.1) } />
                <G rotation={ -90 } origin="7, 7">
                    <Circle
                        cx={ 7 }
                        cy={ 7 }
                        r={ Radius }
                        fill="none"
                        strokeWidth={ 2 }
                        strokeLinecap="round"
                        strokeDasharray={ `${ Circumference }` }
                        strokeDashoffset={ Offset }
                        stroke={ TrackColor ?? BlueColor }
                    />
                </G>
            </Svg>
        </View>
    );
};
