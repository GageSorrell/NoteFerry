/**
 * A full-width image, which is inverted when the theme is dark.
 * Images used with this component should be grayscale and "Notion-themed."
 *
 * @module noteferry/Component/HeroImage
 *
 * @file      HeroImage.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Image } from "expo-image";
import type { ImageAsset } from "@/Domain/Utility/Asset";
import { View } from "react-native";
import { useTheme } from "@noteferry/ui";

/** {@inheritDoc HeroImage} */
export interface HeroImageProps
{
    readonly Source: ImageAsset | undefined;
}

export/**
       * A full-width image, which is inverted when the theme is dark.
       * When no image is specified, an empty View of the same size is returned.
       *
       * @category Component
       * @since 1.0.0
       */
const HeroImage = ({ Source }: HeroImageProps) =>
{
    const { Mode } = useTheme();

    if (Source === undefined)
    {
        return <View style={ {
            alignSelf: "center",
            aspectRatio: 1,
            maxHeight: "67%",
            width: "100%"
        } } />;
    }

    const Base =
        <Image
            source={ Source }
            style={ {
                alignSelf: "center",
                aspectRatio: 1,
                maxHeight: "67%",
                width: "100%"
            } }
        />;

    return Mode === "Light"
        ? Base
        : (
            /* A grayscale graphic's dark strokes/fills invert to pure white,
             * which reads as too stark against the dark background —
             * `brightness` dims that inverted white down to a softer light
             * gray afterward. The (already-dark) inverted background is
             * unaffected: dimming near-zero stays near-zero. */
            <View style={ { filter: [ { invert: 1 }, { brightness: 0.85 } ] } }>
                { Base }
            </View>
        );
};

HeroImage.displayName = "HeroImage";
