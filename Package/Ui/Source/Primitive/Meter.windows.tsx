/**
 * Windows variant of `Meter.tsx`. `MeterBar` is unchanged (plain `View`s,
 * no SVG). `MeterRing` renders its circular progress track through RNW's
 * own native SVG support instead of `react-native-svg` — see
 * `Icon.windows.tsx`'s header comment for why: RN core's `Image` recognizes
 * an SVG payload (via WinUI's `SvgImageSource`) and rasterizes it directly,
 * no extra native module required. The ring is built as a standalone SVG
 * string every time `Value`/`Max`/`TrackColor` change and handed to `Image`
 * as a percent-encoded data URI, replacing `react-native-svg`'s
 * `Svg`/`Circle`/`G` (`origin`/`rotation`) with a plain SVG `<g transform="rotate(...)">`.
 *
 * @module @noteferry/ui/Primitive/Meter
 *
 * @file      Meter.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Image, type StyleProp, View, type ViewStyle } from "react-native";
import { EncodeSvgDataUri, WithAlpha } from "../Utility/index.js";
import { useToken } from "../ThemeProvider.js";

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

const BuildRingMarkup = (Radius: number, BackgroundColor: string, ForegroundColor: string, Circumference: number, Offset: number): string =>
{
    const Track = `<circle cx="7" cy="7" r="${ Radius }" fill="none" stroke="${ BackgroundColor }" stroke-width="2"/>`;
    const Fill =
        `<circle cx="7" cy="7" r="${ Radius }" fill="none" stroke="${ ForegroundColor }" `
        + `stroke-width="2" stroke-linecap="round" `
        + `stroke-dasharray="${ Circumference }" stroke-dashoffset="${ Offset }"/>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">${ Track }`
        + `<g transform="rotate(-90 7 7)">${ Fill }</g></svg>`;
};

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
    const BackgroundColor = WithAlpha(DefaultColor, 0.1);
    const ForegroundColor = TrackColor ?? BlueColor;

    const Uri = React.useMemo(
        () => EncodeSvgDataUri(BuildRingMarkup(Radius, BackgroundColor, ForegroundColor, Circumference, Offset)),
        [ BackgroundColor, ForegroundColor, Circumference, Offset ]
    );

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
            <Image
                source={ { uri: Uri } }
                style={ { height: Size, width: Size } }
            />
        </View>
    );
};
