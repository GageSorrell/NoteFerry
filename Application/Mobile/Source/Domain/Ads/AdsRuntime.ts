/**
 * Orchestrates AdMob startup: gather consent, request ATT, then initialize
 * the Mobile Ads SDK exactly once. Readiness is exposed as a plain
 * `useSyncExternalStore`-backed hook rather than a Context provider, so this
 * sidesteps the React Compiler Context-propagation issue documented on
 * {@link NoteFerryAuthProvider} entirely -- there is no provider to opt out of
 * memoizing.
 *
 * Unlike {@link Supabase}, this must never throw on missing configuration:
 * ads are a non-critical revenue feature, and a misconfigured or absent
 * AdMob setup should silently disable ads rather than crash the app.
 *
 * @module noteferry/Domain/Ads/AdsRuntime
 *
 * @file      AdsRuntime.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { GatherConsent, RequestTrackingIfNeeded } from "./AdConsent";
import mobileAds from "react-native-google-mobile-ads";
import { useSyncExternalStore } from "react";

let Ready = false;
let InitPromise: Promise<void> | null = null;
const Listeners = new Set<() => void>();

const NotifyListeners = (): void =>
{
    for (const Listener of Listeners)
    {
        Listener();
    }
};

const Subscribe = (Listener: () => void): (() => void) =>
{
    Listeners.add(Listener);

    return () => Listeners.delete(Listener);
};

const GetSnapshot = (): boolean => Ready;

export/**
       * Runs consent gathering, ATT, and Mobile Ads SDK initialization exactly
       * once. Safe to call from multiple places (e.g. every render of the root
       * navigator) -- later calls return the same in-flight/completed promise.
       *
       * @category Ads
       * @since 1.0.0
       */
const InitializeAdsRuntime = (): Promise<void> =>
{
    if (InitPromise === null)
    {
        InitPromise = (async (): Promise<void> =>
        {
            await GatherConsent();
            await RequestTrackingIfNeeded();

            try
            {
                await mobileAds().initialize();
            }
            catch (Error)
            {
                /* Ads will simply never load; every placement already
                 * degrades to rendering nothing / no-op when the SDK is not
                 * ready or a request fails. */
                /* eslint-disable-next-line no-console */
                console.error("Failed to initialize the Mobile Ads SDK", Error);
            }

            Ready = true;
            NotifyListeners();
        })();
    }

    return InitPromise;
};

export/**
       * Whether the ads runtime has finished starting up. For use outside
       * components (module singletons like {@link AppOpenAdManager}); inside
       * components, prefer {@link useAdsReady}.
       *
       * @category Ads
       * @since 1.0.0
       */
const IsAdsRuntimeReady = (): boolean => Ready;

export/**
       * Subscribes to ads-runtime readiness.
       *
       * @category Ads
       * @since 1.0.0
       */
const useAdsReady = (): boolean => useSyncExternalStore(Subscribe, GetSnapshot);
