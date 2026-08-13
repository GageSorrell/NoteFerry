/**
 * A full-width image, which is inverted when the theme is dark.
 * Images used with this component should be grayscale and "Notion-themed."
 *
 * @module notivex/Component/HeroImage
 *
 * @file      HeroImage.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Image } from "expo-image";
import type { ImageAsset } from "@/Domain/Utility/Asset";
import { UseTheme } from "@notivex/ui";
import { View } from "react-native";

/** {@inheritDoc HeroImage} */
export interface HeroImageProps
{
    readonly Source: ImageAsset;
}

export/**
       * A full-width image, which is inverted when the theme is dark.
       *
       * @category Component
       * @since 1.0.0
       */
const HeroImage = ({ Source }: HeroImageProps) =>
{
    const { Mode } = UseTheme();

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
            <View style={ { filter: [ { invert: 1 } ] } }>
                { Base }
            </View>
        );
};

HeroImage.displayName = "HeroImage";
