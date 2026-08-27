/**
 * Placement -> ad unit ID resolution. Development builds always resolve to
 * Google's official test ad units, so nothing ever requests a real ad outside
 * a production build; production builds read the matching
 * `EXPO_PUBLIC_ADMOB_*` environment variable. A placement with no configured
 * unit ID resolves to `null` so callers can no-op instead of requesting an ad
 * with a bad ID.
 *
 * @module noteferry/Domain/Ads/AdUnits
 *
 * @file      AdUnits.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Platform } from "react-native";

/** {@inheritDoc AdPlacement} */
export type AppOpenPlacement = "AppOpen";
/** {@inheritDoc AdPlacement} */
export type BannerPlacement = "HomeBanner";
/** {@inheritDoc AdPlacement} */
export type InterstitialPlacement = "OnboardingInterstitial" | "PageCreationInterstitial";
/** {@inheritDoc AdPlacement} */
export type NativePlacement = "HomeNativeAd";

/** Every ad slot in the app. */
export type AdPlacement =
    | AppOpenPlacement
    | BannerPlacement
    | InterstitialPlacement
    | NativePlacement;

const AndroidTestUnitId: Record<AdPlacement, string> = {
    AppOpen: "ca-app-pub-3940256099942544/9257395921",
    HomeBanner: "ca-app-pub-3940256099942544/6300978111",
    HomeNativeAd: "ca-app-pub-3940256099942544/2247696110",
    OnboardingInterstitial: "ca-app-pub-3940256099942544/1033173712",
    PageCreationInterstitial: "ca-app-pub-3940256099942544/1033173712"
};

const IosTestUnitId: Record<AdPlacement, string> = {
    AppOpen: "ca-app-pub-3940256099942544/5575463023",
    HomeBanner: "ca-app-pub-3940256099942544/2934735716",
    HomeNativeAd: "ca-app-pub-3940256099942544/3986624511",
    OnboardingInterstitial: "ca-app-pub-3940256099942544/4411468910",
    PageCreationInterstitial: "ca-app-pub-3940256099942544/4411468910"
};

interface ProductionUnitIdByPlatform
{
    readonly Android: string | undefined;
    readonly Ios: string | undefined;
}

const ProductionUnitId: Record<AdPlacement, ProductionUnitIdByPlatform> = {
    AppOpen: {
        Android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN,
        Ios: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_OPEN
    },
    HomeBanner: {
        Android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_HOME_BANNER,
        Ios: process.env.EXPO_PUBLIC_ADMOB_IOS_HOME_BANNER
    },
    HomeNativeAd: {
        Android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_HOME_NATIVE_AD,
        Ios: process.env.EXPO_PUBLIC_ADMOB_IOS_HOME_NATIVE_AD
    },
    OnboardingInterstitial: {
        Android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_ONBOARDING_INTERSTITIAL,
        Ios: process.env.EXPO_PUBLIC_ADMOB_IOS_ONBOARDING_INTERSTITIAL
    },
    PageCreationInterstitial: {
        Android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_PAGE_CREATION_INTERSTITIAL,
        Ios: process.env.EXPO_PUBLIC_ADMOB_IOS_PAGE_CREATION_INTERSTITIAL
    }
};

const WarnedPlacements = new Set<AdPlacement>();

export/**
       * Resolves the ad unit ID to request for a placement. Always a Google
       * test ID in development; in production, reads the matching
       * `EXPO_PUBLIC_ADMOB_*` variable and returns `null` (logging once) if it
       * has not been configured yet.
       *
       * @category Ads
       * @since 1.0.0
       */
const ResolveAdUnitId = (Placement: AdPlacement): string | null =>
{
    if (__DEV__)
    {
        return (Platform.OS === "ios" ? IosTestUnitId : AndroidTestUnitId)[Placement];
    }

    const ById = ProductionUnitId[Placement];
    const UnitId = Platform.OS === "ios" ? ById.Ios : ById.Android;

    if (!UnitId && !WarnedPlacements.has(Placement))
    {
        WarnedPlacements.add(Placement);
        /* eslint-disable-next-line no-console */
        console.error(
            `No AdMob ad unit ID configured for placement "${ Placement }". `
            + "Set the matching EXPO_PUBLIC_ADMOB_* variable."
        );
    }

    return UnitId ?? null;
};
