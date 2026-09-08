/**
 * Windows variant of `Spinner.tsx`. The rotation animation is unchanged —
 * it was always applied to the wrapping `Animated.View` via a `transform`,
 * never to the SVG content itself, so that part needs no change at all.
 * Only the ring's own rendering changes: RNW's own native SVG support
 * (RN core `Image` recognizing an SVG payload, via WinUI's `SvgImageSource`
 * — see `Icon.windows.tsx`'s header comment for why) replaces
 * `react-native-svg`'s `Svg`/`Circle`/`Animated.createAnimatedComponent(Circle)`,
 * built as a static two-ring SVG string (background track + a 70%-dashed
 * foreground arc) since nothing about the ring's own props actually
 * animates independently of the wrapper's rotation.
 *
 * @module @noteferry/ui/Primitive/Spinner
 *
 * @file      Spinner.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Animated, Easing, Image, type StyleProp, type ViewStyle } from "react-native";
import { EncodeSvgDataUri } from "../Utility/index.js";
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

const BuildSpinnerMarkup = (
    Size: number,
    Radius: number,
    BorderColor: string,
    ActiveColor: string,
    Circumference: number
): string =>
{
    const Center = Size / 2;
    const Track = `<circle cx="${ Center }" cy="${ Center }" r="${ Radius }" fill="none" `
        + `stroke="${ BorderColor }" stroke-width="1.5"/>`;
    const Arc = `<circle cx="${ Center }" cy="${ Center }" r="${ Radius }" fill="none" `
        + `stroke="${ ActiveColor }" stroke-width="1.5" stroke-linecap="round" `
        + `stroke-dasharray="${ Circumference * 0.7 } ${ Circumference }"/>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ Size } ${ Size }">${ Track }${ Arc }</svg>`;
};

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

    const Uri = React.useMemo(
        () => EncodeSvgDataUri(BuildSpinnerMarkup(Size, Radius, BorderColor, ActiveColor, Circumference)),
        [ Size, Radius, BorderColor, ActiveColor, Circumference ]
    );

    return (
        <Animated.View
            accessibilityLabel="Loading"
            accessibilityRole="progressbar"
            style={ [ { height: Size, width: Size }, RotateStyle, Style ] }>
            <Image
                source={ { uri: Uri } }
                style={ { height: Size, width: Size } }
            />
        </Animated.View>
    );
};
