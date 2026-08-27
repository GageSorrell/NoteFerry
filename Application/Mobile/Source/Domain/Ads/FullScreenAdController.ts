/**
 * A load/show/auto-reload state machine shared by every full-screen ad
 * format. `CreateAd` is the only format-specific piece a caller supplies
 * ({@link AppOpenAdManager} passes `AppOpenAd.createForAdRequest`;
 * {@link InterstitialPlacements} passes `InterstitialAd.createForAdRequest`)
 * -- everything else (load/error/close handling, staleness, auto-reload after
 * close) is identical across formats. This is the concrete seam a future
 * Rewarded placement reuses: pass `RewardedAd.createForAdRequest` here and
 * listen for `RewardedAdEventType.EARNED_REWARD` at that call site, without
 * touching this file.
 *
 * @module noteferry/Domain/Ads/FullScreenAdController
 *
 * @file      FullScreenAdController.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { AdEventType } from "react-native-google-mobile-ads";
import { RecordFullScreenAdShown } from "./AdActivity";

const LoadedEvent = "loaded" as AdEventType;
const ErrorEvent = "error" as AdEventType;
const ClosedEvent = "closed" as AdEventType;

/**
 * The subset of InterstitialAd/AppOpenAd/RewardedAd's instance API this
 * controller needs; is deliberately format-agnostic.
 */
export interface FullScreenAdLike
{
    readonly addAdEventListener: (Type: AdEventType, Callback: () => void) => unknown;
    readonly load: () => void;
    readonly show: () => Promise<void>;
}

/** {@inheritDoc CreateFullScreenAdController} */
export interface FullScreenAdControllerOptions
{
    /** Constructs a fresh, unloaded ad instance for the given unit ID. */
    readonly CreateAd: (UnitId: string) => FullScreenAdLike;
}

/** {@inheritDoc CreateFullScreenAdController} */
export interface FullScreenAdController
{
    readonly IsReady: () => boolean;
    readonly Preload: (UnitId: string) => void;
    readonly Show: () => Promise<"Failed" | "NotReady" | "Shown">;
}

type FullScreenAdState = "Idle" | "Loading" | "Loaded" | "Showing";

/**
 * An ad is discarded and silently reloaded rather than shown once it's this
 * stale, matching Google's own guidance on full-screen ad object lifetime.
 */
const MaxAdAgeMs = 4 * 60 * 60 * 1_000;

export/**
       * Builds one independent load/show/auto-reload controller. Create one
       * per placement (not one shared instance across placements) so each
       * placement's ad lifecycle is independent.
       *
       * @category Ads
       * @since 1.0.0
       */
const CreateFullScreenAdController = (
    { CreateAd }: FullScreenAdControllerOptions
): FullScreenAdController =>
{
    let State: FullScreenAdState = "Idle";
    let LoadedAt: number | null = null;
    let CurrentAd: FullScreenAdLike | null = null;

    const IsReady = (): boolean =>
        State === "Loaded"
        && LoadedAt !== null
        && Date.now() - LoadedAt < MaxAdAgeMs;

    const Preload = (UnitId: string): void =>
    {
        if (State === "Loading" || IsReady())
        {
            return;
        }

        State = "Loading";

        const Ad = CreateAd(UnitId);

        Ad.addAdEventListener(LoadedEvent, () =>
        {
            State = "Loaded";
            LoadedAt = Date.now();
        });
        Ad.addAdEventListener(ErrorEvent, () =>
        {
            State = "Idle";
        });
        Ad.addAdEventListener(ClosedEvent, () =>
        {
            State = "Idle";
            LoadedAt = null;
            RecordFullScreenAdShown();
            /* Queue the next occasion's ad immediately rather than waiting for
             * the next explicit `Preload` call. */
            Preload(UnitId);
        });

        CurrentAd = Ad;
        Ad.load();
    };

    const Show = async (): Promise<"Failed" | "NotReady" | "Shown"> =>
    {
        if (!IsReady() || CurrentAd === null)
        {
            return "NotReady";
        }

        State = "Showing";

        try
        {
            await CurrentAd.show();

            return "Shown";
        }
        catch (Error)
        {
            State = "Idle";
            /* eslint-disable-next-line no-console */
            console.error("Failed to show full-screen ad", Error);

            return "Failed";
        }
    };

    return { IsReady, Preload, Show };
};
