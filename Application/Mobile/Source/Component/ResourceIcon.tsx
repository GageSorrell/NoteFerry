/**
 * Renders a database or page's optional Notion icon — emoji, native
 * (Lucide-mapped) glyph, or a remote raster/SVG image — showing a skeleton
 * placeholder while a remote icon's bytes are still being fetched (or
 * decoded into memory), and falling back to a generic page glyph when no
 * icon is supplied at all or a remote icon fails to load. Shared by the
 * onboarding database/page tables and the database settings table so both
 * render icons identically.
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
import { View } from "react-native";

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

    /* A remote icon's bytes can still be in flight (network fetch, or
     * decoding into memory) after Notion has already told us it exists --
     * tracked so a skeleton covers exactly that window, distinct from the
     * `!Resource.Icon` branch below, which is a resolved "no icon" state,
     * not a loading one. */
    const [ ImageLoaded, SetImageLoaded ] = React.useState(false);

    /* An absent icon is a resolved Notion state, not a loading state. */
    if (!Resource.Icon || ImageFailed)
    {
        return (
            <IconBlock
                Icon={ { Src: "file-text", Type: "Lucide" } }
                Size="Small"
                Style={ Styles.FallbackIcon }
            />
        );
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
                <View style={ Styles.IconSlot }>
                    <SvgUri
                        height={ 22 }
                        onError={ () => SetImageFailed(true) }
                        onLoad={ () => SetImageLoaded(true) }
                        style={ Styles.LoadedLayer }
                        uri={ Resource.Icon }
                        width={ 22 }
                    />
                    { !ImageLoaded ? <Skeleton Style={ Styles.IconPlaceholder } /> : null }
                </View>
            );
        }

        return (
            <View style={ Styles.IconSlot }>
                <Image
                    accessibilityIgnoresInvertColors
                    cachePolicy="memory-disk"
                    contentFit="contain"
                    onError={ () => SetImageFailed(true) }
                    onLoad={ () => SetImageLoaded(true) }
                    source={ { uri: Resource.Icon } }
                    style={ [ Styles.Icon, Styles.LoadedImageLayer ] }
                />
                { !ImageLoaded ? <Skeleton Style={ Styles.IconPlaceholder } /> : null }
            </View>
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
    /* IconBlock's Small glyph is 14px; scale it to 18px without changing the
     * component's 20px layout footprint. */
    FallbackIcon: ViewStyle({
        transform: [ { scale: 18 / 14 } ]
    }),
    Icon: ImageStyle({
        borderRadius: 4,
        height: 22,
        width: 22
    }),
    /* Covers `IconSlot` while `LoadedLayer` (the actual image/SVG,
     * loading underneath) hasn't fired `onLoad` yet. */
    IconPlaceholder: ViewStyle({
        height: 22,
        width: 22
    }),
    /* Reserves the icon's footprint for as long as its remote content is
     * loading -- `LoadedLayer` is positioned absolutely within this, so it
     * doesn't itself hold that footprint open once `IconPlaceholder` is
     * gone. */
    IconSlot: ViewStyle({
        height: 22,
        width: 22
    }),
    /* Absolutely fills `IconSlot` so the loading `IconPlaceholder` can
     * overlay it at the same size and position. `Image`'s `style` needs this
     * `ImageStyle`-typed version; `LoadedLayer` below is its `ViewStyle`
     * twin for `SvgUri`. */
    LoadedImageLayer: ImageStyle({
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0
    }),
    LoadedLayer: ViewStyle({
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0
    })
});
