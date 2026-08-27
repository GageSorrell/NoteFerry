/**
 * A single native ad styled to match {@link DatabaseCard}'s shape, so it sits
 * naturally in the home database list rather than looking like an injected
 * banner. Loads its own ad independently per mount -- unlike full-screen
 * formats, native ads are requested contextually per slot rather than
 * preloaded across navigations, and destroys it upon unmount to release
 * native resources.
 *
 * @module noteferry/Component/Ads/NativeDatabaseAdCard
 *
 * @file      NativeDatabaseAdCard.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Description, ItemTitle } from "@noteferry/ui/Primitive/Text";
import { ImageStyle, MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import type { NativeAd } from "react-native-google-mobile-ads";
import { ResolveAdUnitId } from "@/Domain/Ads/AdUnits";
import { useAdsReady } from "@/Domain/Ads/AdsRuntime";
import { useIsAdFree } from "@/Domain/Ads/Entitlement";
import { LoadGoogleMobileAds, type GoogleMobileAdsModule } from "@/Domain/Ads/GoogleMobileAds";
import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

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
    const Styles = useStyles();
    const { t } = useTranslation("component");
    const IsAdFree = useIsAdFree();
    const IsAdsReady = useAdsReady();
    const [ LoadedAd, SetLoadedAd ] = useState<{
        readonly Ad: NativeAd;
        readonly Module: GoogleMobileAdsModule;
    } | null>(null);
    const CardShadow = Theme.Shadow.Card;

    useEffect(() =>
    {
        if (IsAdFree || !IsAdsReady)
        {
            return;
        }

        const UnitId = ResolveAdUnitId("HomeNativeAd");

        if (UnitId === null)
        {
            return;
        }

        let Cancelled = false;
        let Loaded: NativeAd | null = null;

        void LoadGoogleMobileAds()
            .then(async (Module) => ({
                Ad: await Module.NativeAd.createForAdRequest(UnitId),
                Module
            }))
            .then((Next) =>
            {
                if (Cancelled)
                {
                    Next.Ad.destroy();

                    return;
                }

                Loaded = Next.Ad;
                SetLoadedAd(Next);
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

    if (IsAdFree || !IsAdsReady || LoadedAd === null)
    {
        return null;
    }

    const { Ad, Module } = LoadedAd;
    const { NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } = Module;

    return (
        <NativeAdView
            nativeAd={ Ad }
            style={ [
                Styles.Card,
                {
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
            <View style={ Styles.ClippedContent }>
                <NativeMediaView style={ Styles.Cover } />

                { /* Required by AdMob policy: ad content must be clearly
                     distinguishable from app content. */ }
                <View style={ Styles.AdBadge }>
                    <Description
                        Style={ Styles.AdBadgeText }
                        Weight="600">
                        { t("ads.nativeDatabaseAdCard.adBadge") }
                    </Description>
                </View>

                <View style={ Styles.TitleRow }>
                    { Ad.icon && (
                        <NativeAsset assetType={ NativeAssetType.ICON }>
                            <Image
                                accessibilityIgnoresInvertColors
                                cachePolicy="memory-disk"
                                contentFit="contain"
                                source={ { uri: Ad.icon.url } }
                                style={ Styles.Icon }
                            />
                        </NativeAsset>
                    ) }
                    <NativeAsset assetType={ NativeAssetType.HEADLINE }>
                        <ItemTitle
                            NumberOfLines={ 2 }
                            Style={ Styles.Title }
                            Weight="600">
                            { Ad.headline }
                        </ItemTitle>
                    </NativeAsset>
                </View>

                { Ad.callToAction && (
                    <View style={ Styles.CtaRow }>
                        <NativeAsset assetType={ NativeAssetType.CALL_TO_ACTION }>
                            <View style={ Styles.CtaButton }>
                                <Description
                                    Style={ Styles.CtaText }
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

const useStyles = MakeStyles({
    AdBadge: ViewStyle({
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        borderRadius: 4,
        left: Token.Spacing.S,
        paddingHorizontal: 6,
        paddingVertical: 2,
        position: "absolute",
        top: Token.Spacing.S
    }),
    AdBadgeText: TextStyle({
        color: "#FFFFFF",
        fontSize: 11,
        lineHeight: 14
    }),
    Card: ViewStyle({
        alignSelf: "stretch",
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: Token.Radii.ExtraLarge
    }),
    ClippedContent: ViewStyle({
        borderRadius: Token.Radii.ExtraLarge,
        overflow: "hidden"
    }),
    Cover: ImageStyle({
        height: 96,
        width: "100%"
    }),
    CtaButton: ViewStyle({
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: Token.Semantic.Cursor,
        borderRadius: Token.Radii.Large,
        justifyContent: "center",
        paddingHorizontal: 14,
        paddingVertical: Token.Spacing.S
    }),
    CtaRow: ViewStyle({
        paddingBottom: Token.Spacing.M,
        paddingHorizontal: Token.Spacing.L
    }),
    CtaText: TextStyle({
        color: "#FFFFFF",
        fontSize: 13
    }),
    Icon: ImageStyle({
        borderRadius: 4,
        height: 24,
        width: 24
    }),
    Title: TextStyle({
        flex: 1
    }),
    TitleRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 60,
        paddingHorizontal: Token.Spacing.L,
        paddingVertical: Token.Spacing.M
    })
});
