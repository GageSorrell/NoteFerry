/**
 *
 *
 * @module notivex/components/animated-icon
 *
 * @file      animated-icon.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as SplashScreen from "expo-splash-screen";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { Dimensions, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { scheduleOnRN } from "react-native-worklets";
import { useState } from "react";

const InitialScalar = Dimensions.get("screen").height / 90;
const Duration = 600 as const;

/* eslint-disable-next-line jsdoc/require-jsdoc */
export function AnimatedSplashOverlay()
{
    const [ animate, setAnimate ] = useState(false);
    const [ visible, setVisible ] = useState(true);

    if (!visible)
    {
        return null;
    }

    const splashKeyframe = new Keyframe({
        0:
        {
            opacity: 1,
            transform: [ { scale: 1 } ]
        },
        20:
        {
            opacity: 1
        },
        70:
        {
            easing: Easing.elastic(0.7),
            opacity: 0
        },

        100:
        {
            easing: Easing.elastic(0.7),
            opacity: 0,
            transform: [ { scale: 1 } ]
        }
    });

    /* eslint-disable @typescript-eslint/no-require-imports */

    const image =
        <Image
            source={ require("@/assets/images/expo-logo.png") }
            style={ styles.image }
        />;

    /* eslint-enable @typescript-eslint/no-require-imports */

    return animate ? (
        <Animated.View
            entering={ splashKeyframe.duration(Duration).withCallback((IsFinished: boolean) =>
            {
                "worklet";
                if (IsFinished)
                {
                    scheduleOnRN(setVisible, false);
                }
            }) }
            style={ styles.splashOverlay }>
            { image }
        </Animated.View>
    ) : (
        <View
            onLayout={ () => void SplashScreen.hideAsync().finally(() => setAnimate(true)) }
            style={ styles.splashOverlay }>
            { image }
        </View>
    );
}

const keyframe = new Keyframe({
    0:
    {
        transform: [ { scale: InitialScalar } ]
    },
    100:
    {
        easing: Easing.elastic(0.7),
        transform: [ { scale: 1 } ]
    }
});

const logoKeyframe = new Keyframe({
    0:
    {
        opacity: 0,
        transform: [ { scale: 1.3 } ]
    },
    40:
    {
        easing: Easing.elastic(0.7),
        opacity: 0,
        transform: [ { scale: 1.3 } ]
    },

    100:
    {
        easing: Easing.elastic(0.7),
        opacity: 1,
        transform: [ { scale: 1 } ]
    }
});

const glowKeyframe = new Keyframe({
    0:
    {
        transform: [ { rotateZ: "0deg" } ]
    },
    100:
    {
        transform: [ { rotateZ: "7200deg" } ]
    }
});

/* eslint-disable @typescript-eslint/no-require-imports */

/* eslint-disable-next-line jsdoc/require-jsdoc */
export function AnimatedIcon()
{
    return (
        <View style={ styles.iconContainer }>
            <Animated.View
                entering={ glowKeyframe.duration(60 * 1000 * 4) }
                style={ styles.glow }>
                <Image
                    source={ require("@/assets/images/logo-glow.png") }
                    style={ styles.glow }
                />
            </Animated.View>

            <Animated.View
                entering={ keyframe.duration(Duration) }
                style={ styles.background }
            />
            <Animated.View
                entering={ logoKeyframe.duration(Duration) }
                style={ styles.imageContainer }>
                <Image
                    source={ require("@/assets/images/expo-logo.png") }
                    style={ styles.image }
                />
            </Animated.View>
        </View>
    );
}

/* eslint-enable @typescript-eslint/no-require-imports */

const styles = StyleSheet.create({
    background:
    {
        borderRadius: 40,
        experimental_backgroundImage: "linear-gradient(180deg, #3C9FFE, #0274DF)",
        height: 128,
        position: "absolute",
        width: 128
    },
    glow:
    {
        height: 201,
        position: "absolute",
        width: 201
    },
    iconContainer:
    {
        alignItems: "center",
        height: 128,
        justifyContent: "center",
        width: 128,
        zIndex: 100
    },
    image:
    {
        height: 71,
        width: 76
    },
    imageContainer:
    {
        alignItems: "center",
        justifyContent: "center"
    },
    splashOverlay:
    {
        ...StyleSheet.absoluteFill,
        alignItems: "center",
        backgroundColor: "#208AEF",
        justifyContent: "center",
        zIndex: 1000
    }
});
