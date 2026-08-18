/**
 * A single native ad styled to match {@link DatabaseCard}'s shape, so it sits
 * naturally in the home database list rather than looking like an injected
 * banner. Loads its own ad independently per mount -- unlike full-screen
 * formats, native ads are requested contextually per slot rather than
 * preloaded across navigations, and destroys it upon unmount to release
 * native resources.
 *
 * @module notivex/Component/Ads/NativeDatabaseAdCard
 *
 * @file      NativeDatabaseAdCard.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Description, ItemTitle } from "@notivex/ui/Primitive";
import {
    NativeAd,
    NativeAdView,
    NativeAsset,
    NativeAssetType,
    NativeMediaView
} from "react-native-google-mobile-ads";
import { ResolveAdUnitId, useAdsReady, useIsAdFree } from "@/Domain/Ads";
import { StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { useTheme } from "@notivex/ui";

export/**
       * Renders one native ad in the home database list, or nothing while
       * loading, on error, or when the current user is ad-free.
       *
       * @category Components
       * @since 1.0.0
       */
const NativeDatabaseAdCard = (): React.JSX.Element | null =>
{
    const Theme = useTheme();
    const IsAdFree = useIsAdFree();
    const IsAdsReady = useAdsReady();
    const [ Ad, SetAd ] = useState<NativeAd | null>(null);
    const CardShadow = Theme.Shadow.Card;

    useEffect(() =>
    {
        if (IsAdFree || !IsAdsReady)
        {
            SetAd(null);

            return;
        }

        const UnitId = ResolveAdUnitId("HomeNativeAd");

        if (UnitId === null)
        {
            return;
        }

        let Cancelled = false;
        let Loaded: NativeAd | null = null;

        void NativeAd.createForAdRequest(UnitId)
            .then((NextAd: NativeAd) =>
            {
                if (Cancelled)
                {
                    NextAd.destroy();

                    return;
                }

                Loaded = NextAd;
                SetAd(NextAd);
            })
            .catch((Error: unknown) =>
            {
                /* eslint-disable-next-line no-console */
                console.error("Failed to load native ad", Error);
            });

        return () =>
        {
            Cancelled = true;
            Loaded?.destroy();
        };
    }, [ IsAdFree, IsAdsReady ]);

    if (Ad === null)
    {
        return null;
    }

    return (
        <NativeAdView
            nativeAd={ Ad }
            style={ [
                styles.card,
                {
                    backgroundColor: Theme.Semantic.BackgroundModal,
                    borderRadius: Theme.Radii.ExtraLarge,
                    elevation: CardShadow.Elevation,
                    shadowColor: CardShadow.ShadowColor,
                    shadowOffset: CardShadow.ShadowOffset
                        ? {
                            height: CardShadow.ShadowOffset.Height,
                            width: CardShadow.ShadowOffset.Width
                        }
                        : undefined,
                    shadowOpacity: CardShadow.ShadowOpacity,
                    shadowRadius: CardShadow.ShadowRadius
                }
            ] }>
            <View style={ [ styles.clippedContent, { borderRadius: Theme.Radii.ExtraLarge } ] }>
                <NativeMediaView style={ styles.cover } />

                { /* Required by AdMob policy: ad content must be clearly
                     distinguishable from app content. */ }
                <View style={ styles.adBadge }>
                    <Description
                        Style={ styles.adBadgeText }
                        Weight="600">
                        Ad
                    </Description>
                </View>

                <View style={ styles.titleRow }>
                    { Ad.icon && (
                        <NativeAsset assetType={ NativeAssetType.ICON }>
                            <Image
                                accessibilityIgnoresInvertColors
                                cachePolicy="memory-disk"
                                contentFit="contain"
                                source={ { uri: Ad.icon.url } }
                                style={ styles.icon }
                            />
                        </NativeAsset>
                    ) }
                    <NativeAsset assetType={ NativeAssetType.HEADLINE }>
                        <ItemTitle
                            NumberOfLines={ 2 }
                            Style={ styles.title }
                            Weight="600">
                            { Ad.headline }
                        </ItemTitle>
                    </NativeAsset>
                </View>

                { Ad.callToAction && (
                    <View style={ styles.ctaRow }>
                        <NativeAsset assetType={ NativeAssetType.CALL_TO_ACTION }>
                            <View
                                style={ [
                                    styles.ctaButton,
                                    { backgroundColor: Theme.Semantic.Cursor }
                                ] }>
                                <Description
                                    Style={ styles.ctaText }
                                    Weight="600">
                                    { Ad.callToAction }
                                </Description>
                            </View>
                        </NativeAsset>
                    </View>
                ) }
            </View>
        </NativeAdView>
    );
};

const styles = StyleSheet.create({
    adBadge:
    {
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        borderRadius: 4,
        left: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        position: "absolute",
        top: 8
    },
    adBadgeText:
    {
        color: "#FFFFFF",
        fontSize: 11,
        lineHeight: 14
    },
    card:
    {
        alignSelf: "stretch"
    },
    clippedContent:
    {
        overflow: "hidden"
    },
    cover:
    {
        height: 96,
        width: "100%"
    },
    ctaButton:
    {
        alignItems: "center",
        alignSelf: "flex-start",
        borderRadius: 10,
        justifyContent: "center",
        paddingHorizontal: 14,
        paddingVertical: 8
    },
    ctaRow:
    {
        paddingBottom: 12,
        paddingHorizontal: 16
    },
    ctaText:
    {
        color: "#FFFFFF",
        fontSize: 13
    },
    icon:
    {
        borderRadius: 4,
        height: 24,
        width: 24
    },
    title:
    {
        flex: 1
    },
    titleRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 60,
        paddingHorizontal: 16,
        paddingVertical: 12
    }
});
