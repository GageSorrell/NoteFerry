/**
 * Shows a full-screen "app open" ad on return-to-foreground transitions,
 * mirroring {@link Supabase}'s `AppState`-driven singleton pattern. The very
 * first observed `"active"` state (cold start) is never eligible -- the
 * splash screen already covers that moment -- only later
 * background/inactive -> active transitions are candidates.
 *
 * @module noteferry/Domain/Ads/AppOpenAdManager
 *
 * @file      AppOpenAdManager.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AppState, type AppStateStatus } from "react-native";
import { CreateFullScreenAdController, type FullScreenAdController } from "./FullScreenAdController";
import { GetMillisecondsSinceLastFullScreenAd } from "./AdActivity";
import { IsAdFree } from "./Entitlement";
import { IsAdsRuntimeReady } from "./AdsRuntime";
import { ResolveAdUnitId } from "./AdUnits";
import { LoadGoogleMobileAds } from "./GoogleMobileAds";

/**
 * Two app-open ads shown back to back would be jarring even across a rapid
 * app-switcher bounce; require this much quiet time since any full-screen ad
 * (interstitial or app open) before showing another one.
 */
const MinimumGapSinceLastAdMs = 60_000 as const;

let ControllerPromise: Promise<FullScreenAdController> | null = null;

const GetController = (): Promise<FullScreenAdController> =>
{
    ControllerPromise ??= LoadGoogleMobileAds().then(({ AppOpenAd }) =>
        CreateFullScreenAdController({
            CreateAd: (UnitId: string) => AppOpenAd.createForAdRequest(UnitId)
        }));
    return ControllerPromise;
};

let Eligible = false;
let HasSeenFirstForeground = false;

const MaybeShow = async (): Promise<void> =>
{
    if (!Eligible
        || IsAdFree()
        || !IsAdsRuntimeReady()
        || GetMillisecondsSinceLastFullScreenAd() < MinimumGapSinceLastAdMs)
    {
        return;
    }

    const Controller = await GetController();
    if (Eligible && Controller.IsReady())
    {
        await Controller.Show();
    }
};

AppState.addEventListener("change", (State: AppStateStatus) =>
{
    if (State !== "active")
    {
        return;
    }

    if (!HasSeenFirstForeground)
    {
        /* Cold start: the splash screen already covered this transition. */
        HasSeenFirstForeground = true;

        return;
    }

    void MaybeShow();
});

export/**
       * The app-open ad singleton.
       *
       * @category Ads
       * @since 1.0.0
       */
const AppOpenAdManager = {
    /**
     * Enables or disables app-open ads. Fed from the root layout with
     * whether the user is inside the main app (never during sign-in, sync,
     * onboarding, or database settings) -- becoming eligible also kicks off
     * a preload so an ad has a chance to be ready by the next foreground.
     *
     * @category Ads
     * @since 1.0.0
     */
    SetEligibility: (Value: boolean): void =>
    {
        const BecameEligible = Value && !Eligible;

        Eligible = Value;

        if (BecameEligible)
        {
            const UnitId = ResolveAdUnitId("AppOpen");

            if (UnitId !== null)
            {
                void GetController().then((Controller) => Controller.Preload(UnitId));
            }
        }
    }
};
