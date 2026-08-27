/**
 * Renders a database or page's optional Notion icon — emoji, native
 * (Lucide-mapped) glyph, or a remote raster/SVG image — falling back to a
 * skeleton placeholder while there is nothing to show yet or a remote icon
 * fails to load. Shared by the onboarding database/page tables and the
 * database settings table so both render icons identically.
 *
 * @module noteferry/Component/ResourceIcon
 *
 * @file      ResourceIcon.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { ImageStyle, MakeStyles, TextStyle, ViewStyle } from "@noteferry/ui/Core";
import { IconBlock, type LucideIconName } from "@noteferry/ui/Block/IconBlock";
import { ItemTitle } from "@noteferry/ui/Primitive/Text";
import { Skeleton } from "@noteferry/ui/Primitive/Skeleton";
import { Image } from "expo-image";
import { SvgUri } from "react-native-svg";

/** A database or page's optional Notion icon, ahead of client-side normalization. */
export interface ResourceIconSource
{
    readonly Icon?: string | undefined;
    readonly IconType?: "Emoji" | "Image" | "Native" | undefined;
}

/** Whether a Notion icon string can be rendered by `expo-image`. */
const IsImageUrl = (Value: string): boolean =>
    Value.startsWith("https://") || Value.startsWith("http://");

/** Whether a Notion image URL points to SVG artwork. */
const IsSvgUrl = (Value: string): boolean => /\.svg(?:$|[?#])/iu.test(Value);

/** Converts Notion's native icon names to the local Lucide key format. */
const ToLucideIconName = (Value: string): LucideIconName =>
    Value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-") as LucideIconName;

/** {@inheritDoc ResourceIcon} */
export interface ResourceIconProps
{
    readonly Resource: ResourceIconSource;
}

export/**
       * Renders one optional database or page icon.
       *
       * @category Component
       * @since 1.0.0
       */
const ResourceIcon = ({ Resource }: ResourceIconProps): React.JSX.Element =>
{
    const Styles = useStyles();

    /* Remote icons (Image/SvgUri) can fail independently of whether Notion
     * reported one at all — tracked separately so a load failure falls back
     * the same way a missing icon does, rather than leaving a broken image. */
    const [ ImageFailed, SetImageFailed ] = React.useState(false);

    /* Reserves the icon's footprint even when there is no icon to show (or it
     * has not yet been determined whether a fallback is needed), so the
     * title next to it doesn't shift once that determination lands. */
    if (!Resource.Icon || ImageFailed)
    {
        return <Skeleton Style={ Styles.IconPlaceholder } />;
    }

    if (Resource.IconType === "Native")
    {
        return (
            <IconBlock
                Icon={ { Src: ToLucideIconName(Resource.Icon), Type: "Lucide" } }
                Size="Small"
            />
        );
    }

    if (Resource.IconType === "Image" || IsImageUrl(Resource.Icon))
    {
        if (IsSvgUrl(Resource.Icon))
        {
            return (
                <SvgUri
                    height={ 22 }
                    onError={ () => SetImageFailed(true) }
                    uri={ Resource.Icon }
                    width={ 22 }
                />
            );
        }

        return (
            <Image
                accessibilityIgnoresInvertColors
                cachePolicy="memory-disk"
                contentFit="contain"
                onError={ () => SetImageFailed(true) }
                source={ { uri: Resource.Icon } }
                style={ Styles.Icon }
            />
        );
    }

    return (
        <ItemTitle Style={ Styles.Emoji }>
            { Resource.Icon }
        </ItemTitle>
    );
};

ResourceIcon.displayName = "ResourceIcon";

const useStyles = MakeStyles({
    Emoji: TextStyle({
        fontSize: 20,
        lineHeight: 24
    }),
    Icon: ImageStyle({
        borderRadius: 4,
        height: 22,
        width: 22
    }),
    /* Matches Icon's footprint so a missing/undetermined icon still reserves
     * the same space in the row. */
    IconPlaceholder: ViewStyle({
        height: 22,
        width: 22
    })
});
