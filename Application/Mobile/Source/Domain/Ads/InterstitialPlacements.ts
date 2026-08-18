/**
 * Ready-made interstitial placements, each pairing a
 * {@link FullScreenAdController} with the frequency-capping policy that keeps
 * it from being obnoxious. Both entry points are meant to be called
 * fire-and-forget (`void Placement.MaybeShow()`), never awaited, so ad
 * availability can never delay navigation.
 *
 * @module notivex/Domain/Ads/InterstitialPlacements
 *
 * @file      InterstitialPlacements.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { CreateFullScreenAdController } from "./FullScreenAdController";
import { GetMillisecondsSinceLastFullScreenAd } from "./AdActivity";
import { InterstitialAd } from "react-native-google-mobile-ads";
import { IsAdFree } from "./Entitlement";
import { IsAdsRuntimeReady } from "./AdsRuntime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResolveAdUnitId } from "./AdUnits";

/** Show the page-creation interstitial on every Nth successful save, not
 *  every one -- a user creating five pages in a row should not see five
 *  interstitials. */
const PageCreationInterstitialEveryN = 3;
/** Never show a full-screen ad within this long of the last one, of any kind
 *  (interstitial or app open). */
const MinimumIntervalBetweenInterstitialsMs = 3 * 60_000;

const PageCreationCountStorageKey = "@notivex/ads-page-creation-count" as const;

const CanShowInterstitial = (): boolean =>
    !IsAdFree()
    && IsAdsRuntimeReady()
    && GetMillisecondsSinceLastFullScreenAd() >= MinimumIntervalBetweenInterstitialsMs;

const PageCreationController = CreateFullScreenAdController({
    CreateAd: (UnitId: string) => InterstitialAd.createForAdRequest(UnitId)
});
const OnboardingController = CreateFullScreenAdController({
    CreateAd: (UnitId: string) => InterstitialAd.createForAdRequest(UnitId)
});

export/**
       * Preloads both interstitial placements. Call once the ads runtime is
       * ready (see the root layout) so an ad has a chance to already be
       * loaded by the time either placement's "maybe show" moment happens.
       *
       * @category Ads
       * @since 1.0.0
       */
const PreloadInterstitialPlacements = (): void =>
{
    const PageCreationUnitId = ResolveAdUnitId("PageCreationInterstitial");
    const OnboardingUnitId = ResolveAdUnitId("OnboardingInterstitial");

    if (PageCreationUnitId !== null)
    {
        PageCreationController.Preload(PageCreationUnitId);
    }

    if (OnboardingUnitId !== null)
    {
        OnboardingController.Preload(OnboardingUnitId);
    }
};

export/**
       * The post-page-creation interstitial placement.
       *
       * @category Ads
       * @since 1.0.0
       */
const PageCreationInterstitial = {
    /**
     * Records a successful page creation and shows the interstitial once
     * every {@link PageCreationInterstitialEveryN} creations, subject to the
     * shared cross-placement cooldown.
     *
     * @category Ads
     * @since 1.0.0
     */
    RecordSuccessAndMaybeShow: async (): Promise<void> =>
    {
        const Stored = await AsyncStorage.getItem(PageCreationCountStorageKey);
        const NextCount = (Stored === null ? 0 : Number.parseInt(Stored, 10)) + 1;

        await AsyncStorage.setItem(PageCreationCountStorageKey, String(NextCount));

        if (NextCount % PageCreationInterstitialEveryN !== 0 || !CanShowInterstitial())
        {
            return;
        }

        if (PageCreationController.IsReady())
        {
            await PageCreationController.Show();

            return;
        }

        const UnitId = ResolveAdUnitId("PageCreationInterstitial");

        if (UnitId !== null)
        {
            PageCreationController.Preload(UnitId);
        }
    }
};

export/**
       * The post-onboarding interstitial placement.
       *
       * @category Ads
       * @since 1.0.0
       */
const OnboardingInterstitial = {
    /**
     * Shows the post-onboarding interstitial, subject to the shared
     * cross-placement cooldown. Meant to be called once, right after
     * onboarding completes.
     *
     * @category Ads
     * @since 1.0.0
     */
    MaybeShow: async (): Promise<void> =>
    {
        if (!CanShowInterstitial())
        {
            return;
        }

        if (OnboardingController.IsReady())
        {
            await OnboardingController.Show();

            return;
        }

        const UnitId = ResolveAdUnitId("OnboardingInterstitial");

        if (UnitId !== null)
        {
            OnboardingController.Preload(UnitId);
        }
    }
};
